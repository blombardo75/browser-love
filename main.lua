function getParticleTargets()
	targets = {}
	i = 100
	while i<love.graphics.getWidth()-1 do
		for j=0,love.graphics.getHeight()-1 do
			table.insert(targets, {100+i,j})
		end
		for j=love.graphics.getHeight()-1,0,-1 do
			table.insert(targets, {100+i+1,j})
		end
		i=i+2
	end
	return targets
end

spawnVel = 250
spawnAngleChange = 4

lockedParticles = {}
particles = {}
particleTargets = getParticleTargets()
numSpawns = 0

function colorFromTarget(x,y)
	--return {math.random(), math.random(), math.random()}
	return {1-y/love.graphics.getHeight(), 0, y/love.graphics.getHeight()}
end

function spawnParticle(posx, posy)
	numSpawns=numSpawns+1
	angle = math.random()*2*math.pi
	newParticle = {
		pos = {posx, posy},
		vel = xyFromAngleMag(angle, spawnVel),
		angleChange = spawnAngleChange,
		target = particleTargets[numSpawns]
	}
	newParticle.color = colorFromTarget(newParticle.target[1], newParticle.target[2])
	table.insert(particles, newParticle)
end

function angleFromXY(x,y)
	if x==0 and y==0 then
		return 0
	end
	norm = math.sqrt(x*x+y*y)
	angle = math.acos(x/norm)
	if y<0 then
		angle = 2*math.pi - angle
	end
	return angle
end

function xyFromAngleMag(angle, mag)
	return {mag*math.cos(angle), mag*math.sin(angle)}
end

function getVoids(numVoids)
	for i, target in ipairs() do
		a=0
	end
end

function updateParticles(dt)
	newParticles = {}
	for i, particle in ipairs(particles) do
		dists = {particle.target[1]-particle.pos[1], particle.target[2]-particle.pos[2]}
		targetDist = math.sqrt(dists[1]*dists[1]+dists[2]*dists[2])
		velMag = math.sqrt(particle.vel[1]*particle.vel[1]+particle.vel[2]*particle.vel[2])
		if targetDist<velMag*dt then
			if #lockedParticles>=10000 then
				table.remove(lockedParticles,1)
			end
			table.insert(lockedParticles, {particle.color, particle.target})
		else
			table.insert(newParticles, particle)
			particle.pos = {particle.pos[1]+particle.vel[1]*dt, particle.pos[2]+particle.vel[2]*dt}
			if particle.pos[1]<0 then
				particle.pos[1]=0
				particle.vel[1]=-particle.vel[1]
			elseif particle.pos[1]>love.graphics.getWidth()-1 then
				particle.pos[1]=love.graphics.getWidth()-1
				particle.vel[1]=-particle.vel[1]
			end
			if particle.pos[2]<0 then
				particle.pos[2]=0
				particle.vel[2]=-particle.vel[2]
			elseif particle.pos[2]>love.graphics.getHeight()-1 then
				particle.pos[2]=love.graphics.getHeight()-1
				particle.vel[2]=-particle.vel[2]
			end
			particle.angleChange = particle.angleChange + 0.5*dt
		end
		if particle.pos~=particle.target then
			currAngle = angleFromXY(particle.vel[1], particle.vel[2])
			targetAngle = angleFromXY(particle.target[1]-particle.pos[1], particle.target[2]-particle.pos[2])
			if targetAngle<currAngle then
				targetAngle = targetAngle + 2*math.pi
			end
			newAngle = currAngle
			if targetAngle-currAngle<math.pi then
				if targetAngle-currAngle<particle.angleChange*dt then
					newAngle = targetAngle
				else
					newAngle = newAngle + particle.angleChange*dt
				end
			else
				if targetAngle-currAngle>2*math.pi-particle.angleChange*dt then
					newAngle = targetAngle
				else
					newAngle = newAngle - particle.angleChange*dt
				end
			end
			particle.vel = xyFromAngleMag(newAngle, velMag)
		end
	end
	particles = newParticles
end

function love.draw()
	love.graphics.setColor(1,1,1)
	for i, particle in ipairs(lockedParticles) do
		love.graphics.setColor(particle[1][1], particle[1][2], particle[1][3])
		love.graphics.points(particle[2][1]+0.5, particle[2][2]+0.5)
	end
	for i, particle in ipairs(particles) do
		love.graphics.setColor(particle.color[1], particle.color[2], particle.color[3])
		love.graphics.points(particle.pos[1]+0.5, particle.pos[2]+0.5)
	end
end

function love.update(dt)
	spawnParticle(500, 500)
	updateParticles(dt)
	print(#lockedParticles, #particles)
end

function love.mousepressed(x, y, button, istouch, presses)
	for i=1,1000 do
		spawnParticle(500, 500)
	end
end