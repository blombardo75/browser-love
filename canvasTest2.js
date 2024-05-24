function draw() {
    tempLove.fillBg(0, 0, 0);
    lockedParticles.forEach(particle => {
        tempLove.setColor(particle[0][0], particle[0][1], particle[0][2])
		tempLove.point(particle[1][0]+0.5, particle[1][1]+0.5)
    })
    particles.forEach(particle => {
        tempLove.setColor(particle.color[0], particle.color[1], particle.color[2])
		tempLove.point(particle.pos[0]+0.5, particle.pos[1]+0.5)
    })
    tempLove.sendPoints();
}

function update(dt) {
    spawnParticle(500, 500)
	updateParticles(dt)
	print(lockedParticles.length, particles.length)
}

function mousepressed(x, y) {
    for(let i=0; i<1000; i++) spawnParticle(500, 500);
}

function getParticleTargets() {
	var targets = []
	var i = 100
	while (i<love.window.getWidth()-1) {
        for (let j=0; j<love.window.getHeight(); j++) {
            targets.push([100+i, j]);
        }
        for (let j=love.window.getHeight()-1; j>-1; j--) {
            targets.push([100+i+1, j]);
        }
		i+=2
    }
	return targets
}

function colorFromTarget(x,y) {
	return [1-y/love.window.getHeight(), 0, y/love.window.getHeight()]
}

function spawnParticle(posx, posy) {
	numSpawns++;
	angle = Math.random()*2*Math.PI
	newParticle = {
		pos: [posx, posy],
		vel: xyFromAngleMag(angle, spawnVel),
		angleChange: spawnAngleChange,
		target: particleTargets[numSpawns-1]
	}
	newParticle.color = colorFromTarget(...newParticle.target)
    particles.push(newParticle)
}

function angleFromXY(x,y) {
	if (x==0 && y==0) {
		return 0
    }
	norm = Math.sqrt(x*x+y*y)
	angle = Math.acos(x/norm)
	if (y<0) {
		angle = 2*Math.PI - angle
    }
	return angle
}

function xyFromAngleMag(angle, mag) {
	return [mag*Math.cos(angle), mag*Math.sin(angle)]
}

function updateParticles(dt) {
	newParticles = []
    particles.forEach((particle, i) => {
        dists = [particle.target[0]-particle.pos[0], particle.target[1]-particle.pos[1]]
		targetDist = Math.sqrt(dists[0]*dists[0]+dists[1]*dists[1])
		velMag = Math.sqrt(particle.vel[0]*particle.vel[0]+particle.vel[1]*particle.vel[1])
		if (targetDist<velMag*dt) {
			if (lockedParticles.length>=10000) {
                lockedParticles = lockedParticles.slice(1)
            }
            lockedParticles.push([particle.color, particle.target]);
        } else {
            newParticles.push(particle);
			particle.pos = [particle.pos[0]+particle.vel[0]*dt, particle.pos[1]+particle.vel[1]*dt]
			if (particle.pos[0]<0) {
				particle.pos[0]=0
				particle.vel[0]=-particle.vel[0]
            } else if (particle.pos[0]>love.window.getWidth()-1) {
				particle.pos[0]=love.window.getWidth()-1
				particle.vel[0]=-particle.vel[0]
            }
            if (particle.pos[1]<0) {
				particle.pos[1]=0
				particle.vel[1]=-particle.vel[1]
            } else if (particle.pos[1]>love.window.getHeight()-1) {
				particle.pos[1]=love.window.getHeight()-1
				particle.vel[1]=-particle.vel[1]
            }
			particle.angleChange = particle.angleChange + 0.5*dt    
        }
		if (particle.pos!=particle.target) {
			currAngle = angleFromXY(particle.vel[0], particle.vel[1])
			targetAngle = angleFromXY(particle.target[0]-particle.pos[0], particle.target[1]-particle.pos[1])
			if (targetAngle<currAngle) {
				targetAngle = targetAngle + 2*Math.PI
            }
			newAngle = currAngle
			if (targetAngle-currAngle<Math.PI) {
				if (targetAngle-currAngle<particle.angleChange*dt) {
                    newAngle = targetAngle
                } else {
					newAngle = newAngle + particle.angleChange*dt
                }
            } else {
                if (targetAngle-currAngle>2*Math.PI-particle.angleChange*dt) {
                    newAngle = targetAngle
                } else {
					newAngle = newAngle - particle.angleChange*dt
                }
            }
			particle.vel = xyFromAngleMag(newAngle, velMag)
        }
    });
	particles = newParticles;
}

function init() {
    spawnVel = 250
    spawnAngleChange = 4

    lockedParticles = []
    particles = []
    particleTargets = getParticleTargets()
    numSpawns = 0
}