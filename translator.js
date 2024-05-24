var useBig = false;
async function readLua(filename) {
    /*let fr = new FileReader();
    fr.readAsText(filename);
    return fr.result;
    return await fetch(filename).then((res) => res.text())*/
    var temp1 = `function getParticleTargets()
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
end`
	var temp2 = `require("gelatoid")
require("stages")
require("enemies/enemies")
require("enemies/bullets")

controls = {
    up="up",
    down="down",
    right="right",
    left="left",
    fire="z",
    start="return",
	chill="x"
}

currentScene = 0
savedGame = false
vsyncMode = 1
autoscrollSpeed = 240
chillFactor = 5/8
soundVolume = {music = 6, sfx = 6}
mouseScrollBounds = {320, 32}
snapSize = 32
catalogSize = 32
catalog2Size = 64
mouseScrollMult = 6
profileMode = false

timer = {}
timerData = { --change per second, cap, type
	starsBlink = {60, 50, "loop"},
	titleMod = {60, 270, "loop"},
	titleFade = {60, 100, "once"},
	pressFireBlink = {60, 100, "loop"},
	startWait = {60, 100, "once"},
	gameWait = {60, 50, "once"}
}

function moveScene(newScene)
	if newScene == 0 then --title screen
		timer.pressFireBlink = 0
		timer.starsBlink = 0
		timer.titleFade = 0
		timer.titleMod = 0
		timer.background = {0, 0, 0, 0}
	elseif newScene == 1 then --main menu
		timer.titleFade = 100
		timer.startWait = 0
		selection = 2
		startPressed = false
	elseif newScene == 2 then --options
		configSection = 0
		selection = 1
	elseif newScene == 3 then --in-game
		timer.gameWait = 0
		cameraX = 0
		score = 0
		currentCheckpoint = 1
		currentLevel = 1
		loadLevelData(1)
		loadedEnemies = {}
		enemyBullets = {}
		playerBullets = {}
		gelatoid:reset()
	elseif newScene == 4 then --level editor
		gelatoid:reset()
		resetLevelEditor(1)
		devSettings = {
			toggleOutlines = true,
			previewMode = false,
			showGrid = false,
			fastScroll = false
		}
	else
		error("Invalid Scene: " .. currentScene)
	end
	currentScene = newScene
end

function splitString(s, delimiter)
	local a = {}
	local b = 1
	for c in string.gmatch(s, '([^'..delimiter..']+)') do
		a[b] = c
		b = b+1
	end
	return a
end

function iteratorToTable(iterator, keys)
	local a = {}
	local b = 1
	for c in iterator do
		a[keys[b]] = c
		b = b+1
	end
	return a
end

function tableToArray(t, keys)
	local a = {}
	for index, key in ipairs(keys) do
		a[index] = t[key]
	end
	return a
end

function writeDataToFile(rawKey, newData, filePath, fileName)
	local listData = {}
	for _, a in ipairs(rawKey) do
		table.insert(listData, newData[a] or "Placeholder")
	end
	love.filesystem.createDirectory(filePath)
	return love.filesystem.write(filePath.."/"..fileName, table.concat(listData, "\\n"))
end

function loadLevelData(level)
	local rawKey = {"background", "entities", "checkpoints", "music", "soundEffects"} --UNUSED: background, soundEffects
	local rawData = iteratorToTable(love.filesystem.lines("levelData/levelData"..level..".txt"), rawKey)
	--entities
	local entityKey = {"enemyType", "x", "y"}
	loadQueue = {}
	for entity in string.gmatch(rawData.entities, '([^|]+)') do
		local splitEntity = iteratorToTable(string.gmatch(entity, '([^,]+)'), entityKey)
		local builtEntity = newEnemy(splitEntity.enemyType, {x = tonumber(splitEntity.x), y = tonumber(splitEntity.y)})
		table.insert(loadQueue, builtEntity)
	end
	--checkpoints
	checkpoints = splitString(rawData.checkpoints, ",")
	--music
	currentMusic = audioFiles[rawData.music]
end

function newEnemyFromLevelData(level, enemyIndex)
	local tempEnemies = loadQueue
	loadLevelData(level)
	local newEnemy = loadQueue[enemyIndex]
	loadQueue = tempEnemies
	return newEnemy
end

function writeLevelData(level)
	local rawKey = {"background", "entities", "checkpoints", "music", "soundEffects"}
	local newData = {}
	
	local stringEntities = {}
	local entityKey = {"enemyType", "x", "y"}
	for _, entity in ipairs(loadQueue) do
		table.insert(stringEntities, table.concat(tableToArray(entity, entityKey), ","))
	end
	newData.entities = table.concat(stringEntities, "|")
	newData.checkpoints = table.concat(checkpoints, ",")
	newData.music = "stage01Gelato"
	
	return writeDataToFile(rawKey, newData, "levelData", "levelData"..level..".txt")
end

function setVsyncMode()
	local w,h,t = love.window.getMode()
	love.window.setMode(w, h, {vsync=vsyncMode})
end

function loadPlayerSettings()
	local rawKey = {"volume", "controls", "vsync"}
	local rawData = iteratorToTable(love.filesystem.lines("playerSettings.txt"), rawKey)
	--volume
	local a = splitString(rawData.volume, ",")
	soundVolume.music = tonumber(a[1])
	soundVolume.sfx = tonumber(a[2])
	updateAudioVolume()
	--controls
	controls = {}
	for index, control in ipairs(splitString(rawData.controls, "|")) do
		local b = splitString(control, ",")
		controls[b[1]] = b[2]
	end
	--vsync
	vsyncMode = tonumber(rawData.vsync)
	setVsyncMode()
end

function writePlayerSettings()
	local rawKey = {"volume", "controls", "vsync"}
	local newData = {}
	
	newData.volume = soundVolume.music..","..soundVolume.sfx
	
	local newControls = {}
	for k,v in pairs(controls) do
		table.insert(newControls, k..","..v)
	end
	newData.controls = table.concat(newControls, "|")
	
	newData.vsync = tostring(vsyncMode)
	
	return writeDataToFile(rawKey, newData, "", "playerSettings.txt")
end

function loadDevData()
	savedGroups = {}
	if love.filesystem.getInfo("devData.txt") then
		local rawKey = {"savedGroups"}
		local rawData = iteratorToTable(love.filesystem.lines("devData.txt"), rawKey)
		if string.find(rawData.savedGroups, "|") then
			for index, group in ipairs(splitString(rawData.savedGroups, "|")) do
				local newGroup = {}
				for index2, enemy in ipairs(splitString(group, ",")) do
					local enemyData = splitString(enemy, " ") --name, relativeX, relativeY
					enemyData[2] = tonumber(enemyData[2])
					enemyData[3] = tonumber(enemyData[3])
					table.insert(newGroup, enemyData)
				end
				table.insert(savedGroups, newGroup)
			end
		end
	end
end

function writeDevData()
	local rawKey = {"savedGroups"}
	local newData = {}
	local groupsData = {}
	for index, group in ipairs(savedGroups) do
		local groupData = {}
		for index2, enemy in ipairs(group) do
			table.insert(groupData, table.concat(enemy, " "))
		end
		table.insert(groupsData, table.concat(groupData, ","))
	end
	newData.savedGroups = table.concat(groupsData, "|")
	return writeDataToFile(rawKey, newData, "", "devData.txt")
end

function resetLevelEditor(level)
	loadDevData()
	loadLevelData(level)
	loadedEnemies = loadQueue
	loadLevelData(level)
	cameraX = 0
	for index, item in ipairs(loadedEnemies) do
		extraDt = item:calculateLoadDelay()
		item:updateAll(extraDt)
	end
	enemyBullets = {}
	selection = {"none"}
	dupOrigins = {}
	for a=1,#loadQueue do
		dupOrigins[a] = a
	end
	movingItem = false
end

function hasValue(value, list)
	for k, a in pairs(list) do
		if value==a then
			return k
		end
	end
	return false
end

function tableRemove(t, indices)
	local n = #t
	for _, i in ipairs(indices) do
		t[i] = nil
	end
	local j = 0
	for i=1,n do
		if t[i]~=nil then
			j=j+1
			t[j]=t[i]
		end
	end
	for i=j+1,n do
		t[i]=nil
	end
end

function loadImageWithQuads(imageFile)
	local a = {image=love.graphics.newImage(imageFile), quads={}}
	function a:addQuad(x, y, w, h)
		table.insert(self.quads, love.graphics.newQuad(x, y, w, h, self.image:getDimensions()))
	end
	return a
end

function love.load()
	love.graphics.setDefaultFilter("nearest","nearest",1)
	love.graphics.setFont(love.graphics.newImageFont("font.png"," ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?x-.+="))
    background:load()
	
	title = loadImageWithQuads("title.png")
    for a=0,4 do title:addQuad(0, 64*a, 256, 64) end

	titleStars = loadImageWithQuads("title_stars.png")
	for a=0,2 do titleStars:addQuad(0, 320*a, 288, 320) end

	volumeBars = loadImageWithQuads("volume_bars.png")
    for a=0,6 do volumeBars:addQuad(0, 8*a, 24, 8) end
	
	itemBox = love.graphics.newImage("item_box.png") --22x16
	items = {loadImageWithQuads("items.png"), loadImageWithQuads("items.png"), loadImageWithQuads("items.png")}
	for a=0,2 do items[1]:addQuad(0, 16*a, 16, 16) end
	for a=0,2 do items[2]:addQuad(16, 16*a, 16, 16) end
	for a=0,3 do items[3]:addQuad(32, 16*a, 16, 16) end
	
	pointer = {left=love.graphics.newImage("pointer_left.png"), right=love.graphics.newImage("pointer_right.png")}
	
    audioFiles = {
        menuNavigate = love.audio.newSource("sfx/m_navigate.wav", "static"),
        menuSelect = love.audio.newSource("sfx/m_select.wav", "static"),
        menuDone = love.audio.newSource("sfx/m_done.wav", "static"),
        startGame = love.audio.newSource("sfx/start_game.wav", "static"),
        gelatoidTitle = love.audio.newSource("music/gelatoid.ogg", "stream"),
        stage01Gelato = love.audio.newSource("music/stage_01_gelato.ogg", "stream")
    }
	currentMusic = audioFiles.gelatoidTitle
	
	gelatoid:load()
	
	for _, EnemyClass in pairs(EnemyClasses) do
		EnemyClass:load()
	end
	for _, BulletClass in pairs(BulletClasses) do
		BulletClass:load()
	end
	
	moveScene(0)
	if love.filesystem.getInfo("playerSettings.txt") then
		loadPlayerSettings()
	else
		setVsyncMode()
	end
	
	if profileMode then 
		love.profiler = require('profile') 
		love.profiler.start()
	end
end

function drawMenuBackground()
	--main background
	background:draw("menu")
	
	--title stars
	local a = math.floor(timer.starsBlink/10)+1
	local b = {1, 2, 3, 3, 2}
	love.graphics.draw(titleStars.image, titleStars.quads[b[a]], 0, 0, 0, 2)
	
	--title
	local a = math.abs(timer.titleMod-135)
	local b = {15, 45, 60, 75, 105, a}
	table.sort(b)
	local titleMod = 12-2*hasValue(a, b)
	local c = timer.titleFade<100 and math.floor(timer.titleFade/20)+1 or 5
	love.graphics.draw(title.image, title.quads[c], 16*2, (64*2) + titleMod, 0, 2)
end

function drawPointerSet(positions)
	love.graphics.draw(pointer.right, positions[selection][1]*2, positions[selection][3]*2, 0, 2)
    love.graphics.draw(pointer.left, positions[selection][2]*2, positions[selection][3]*2, 0, 2)
end

function drawHUD()
	--love.graphics.print(string.upper(math.floor(cameraX)), 100, 100)
	love.graphics.print("SCORE\\n"..string.format("%07d", score), 32, 16)
	checkpointDisplay = currentCheckpoint<=#checkpoints and string.rep("+", currentCheckpoint-1) or string.rep("+", currentCheckpoint-2).."="
	love.graphics.print("  x"..string.format("%02d", gelatoid.lives).."\\n"..checkpointDisplay, 160, 16)
	love.graphics.draw(items[3].image, items[3].quads[gelatoid.power], 160, 7, 0, 2)
	love.graphics.print("CONE", 256, 0)
	
	if devMode then
		love.graphics.print("G-"..#gelatoid.bullets, 0, 624)
		love.graphics.print("B-"..#enemyBullets, 80, 624)
		love.graphics.print("E-"..#loadedEnemies, 160, 624)
		love.graphics.print("FPS-"..love.timer.getFPS(), 240, 624)
	end
	
	--love.graphics.draw(itemBox, centerX-12, centerY-8, 0, 2)
	--love.graphics.draw(itemImage, itemQuad, centerX-8, centerY-8, 0, 2)
	
	love.graphics.draw(itemBox, 266, 16, 0, 2)
	love.graphics.draw(items[1].image, items[1].quads[gelatoid.currentCone], 272, 16, 0, 2)
	love.graphics.print("FLAVOR", 320, 48)
	love.graphics.draw(itemBox, 346, 16, 0, 2)
	if gelatoid.power>1 then
		love.graphics.draw(items[2].image, items[2].quads[gelatoid.power], 352, 16, 0, 2)
	end
	love.graphics.print("STAGE "..currentLevel, 432, 16)
end

function drawButton(text, x, y, w, h, textColor, bgColor)
	love.graphics.setColor(bgColor[1], bgColor[2], bgColor[3])
	love.graphics.rectangle("fill", x, y, w, h)
	love.graphics.setColor(textColor[1], textColor[2], textColor[3])
	local xShift = (w-16*string.len(text))/2
	local yShift = (h-16)/2
	love.graphics.print(text, x+xShift, y+yShift)
	love.graphics.setColor(1, 1, 1)
end

function getRelativeGroupPositions()
	local itemList = selection[1] == "enemy" and loadQueue or selection[1] == "bullet" and enemyBullets
	local focusedItem = itemList[selection[2][1]]
	if #selection[2]>1 then
		for i=2,#selection[2] do
			local newItem = itemList[selection[2][i]]
			local currentSum = focusedItem.x + focusedItem.y
			local newSum = newItem.x + newItem.y
			if newSum<currentSum or newSum==currentSum and newItem.x<focusedItem.x then
				focusedItem = newItem
			end
		end
	end
	local relativePositions = {}
	for i, i2 in ipairs(selection[2]) do
		relativePositions[i] = {itemList[i2].enemyType or itemList[i2].bulletType, itemList[i2].x - focusedItem.x, itemList[i2].y - focusedItem.y}
	end
	return relativePositions
end

function getGroupSize(group)
	local minShift = {0, 0}
	local maxShift = {0, 0}
	for index, enemy in ipairs(group) do
		minShift[1] = math.min(minShift[1], enemy[2])
		minShift[2] = math.min(minShift[2], enemy[3])
		maxShift[1] = math.max(maxShift[1], enemy[2]+2*EnemyClasses[enemy[1]].quadSize[1])
		maxShift[2] = math.max(maxShift[2], enemy[3]+2*EnemyClasses[enemy[1]].quadSize[2])
	end
	return {minShift, {maxShift[1]-minShift[1], maxShift[2]-minShift[2]}}
end

function love.draw()
    if currentScene == 0 then
        drawMenuBackground()
        if timer.titleFade==100 and timer.pressFireBlink >= 50 then
            love.graphics.print("PRESS START",100*2,256*2)
        end
    elseif currentScene == 1 then
        drawMenuBackground()
		if devMode then
			love.graphics.print("FPS-"..love.timer.getFPS(), 0, 0)
		end
		if savedGame then
			love.graphics.print("CONTINUE",112*2,192*2)
		end
		if timer.startWait == 0 or (timer.startWait%20 > 0 and timer.startWait%20 < 10 and timer.startWait < 90) then
			love.graphics.print("START",124*2,208*2)
		end
		love.graphics.print("OPTIONS", 116*2, 224*2)
		if devMode then
			love.graphics.print("LEVEL EDITOR", 96*2, 240*2)
		end
		drawPointerSet({
            {96, 184, 192},
            {108, 172, 208},
            {100, 180, 224},
			{80, 200, 240},
        })
        love.graphics.print("HIGH SCORE - 0000000", 64*2, 160*2)
		love.graphics.print("2019 NEGATIVEBREAD - ALPHA V0.2", 8*2, 304*2)
    elseif currentScene == 2 then
        drawMenuBackground()
		if devMode then
			love.graphics.print("FPS-"..love.timer.getFPS(), 0, 0)
		end
		love.graphics.print("MUSIC",112*2,176*2)
		love.graphics.draw(volumeBars.image, volumeBars.quads[7-soundVolume.music], 152*2, 176*2, 0, 2)
		love.graphics.print("SFX",120*2,192*2)
        love.graphics.draw(volumeBars.image, volumeBars.quads[7-soundVolume.sfx], 144*2, 192*2, 0, 2)
		love.graphics.print("VSYNC "..(vsyncMode==1 and "ON" or "OFF"), 216+8*vsyncMode, 208*2)
		love.graphics.print("CONFIGURE CONTROLS", 72*2, 224*2)
		love.graphics.print("BACK", 128*2, 240*2)
		drawPointerSet({
            {96, 184, 176}, --140 +- 44
            {104, 176, 192}, --140 +- 36
			{92+4*vsyncMode, 188-4*vsyncMode, 208}, --140 +- ??
            {56, 224, 224},
            {112, 168, 240} --140 +- 28
        })
        if configSection>0 then
            local a = {"UP", "DOWN", "LEFT", "RIGHT", "FIRE", "CHILL", "START"}
			local b = a[configSection]
			love.graphics.print("PRESS "..b.." KEY", 208 - 8*string.len(b), 256*2)
        end
		love.graphics.print("2019 NEGATIVEBREAD - ALPHA V0.2", 8*2, 304*2)
    elseif currentScene == 3 then
        background:draw("inGame")
		drawHUD()
		for index, enemy in ipairs(loadedEnemies) do
			enemy:draw()
		end
		gelatoid:draw()
		for index, bullet in ipairs(gelatoid.bullets) do
			bullet:draw()
		end
		for index, bullet in ipairs(enemyBullets) do
			bullet:draw()
		end
	elseif currentScene == 4 then
		if makingNewGroup then
			if selection[1] == "catalogGroup" then
				local groupSize = getGroupSize(savedGroups[selection[2]])[2]
				love.graphics.print("NEW GROUP OF "..#savedGroups[selection[2]], 8, 8)
				love.graphics.print("INDEX "..selection[2], 8, 32)
				love.graphics.print("SIZE "..groupSize[1].."-"..groupSize[2], 8, 56)
				local startX = catalog2Size*((selection[2]-1)%(576/catalog2Size))
				local startY = 100+catalog2Size*math.floor((selection[2]-1)*catalog2Size/576)
				love.graphics.rectangle("fill", startX, startY, catalog2Size, catalog2Size)
				drawButton("CONFIRM", 368, 0, 128, 32, {0, 0, 0}, {0, 1, 0})
				drawButton("DEL", 520, 32, 56, 32, {0, 0, 0}, {1, 0, 0})
			else
				love.graphics.print("CHOOSE YOUR NEW GROUP", 8, 8)
			end
			drawButton("BACK", 496, 0, 80, 32, {0, 0, 0}, {1, 0, 0})
			
			--draw the groups
			for index, savedGroup in ipairs(savedGroups) do
				local startX = catalog2Size*((index-1)%(576/catalog2Size))
				local startY = 100+catalog2Size*math.floor((index-1)*catalog2Size/576)
				love.graphics.rectangle("line", startX, startY, catalog2Size, catalog2Size)
				local groupSize = getGroupSize(savedGroup)
				local groupShift = groupSize[1]
				groupSize = groupSize[2]
				local drawScaling = catalog2Size/math.max(groupSize[1], groupSize[2])
				for index2, enemy in ipairs(savedGroup) do
					love.graphics.draw(EnemyClasses[enemy[1]].defaultQuad[1], EnemyClasses[enemy[1]].defaultQuad[2], startX+(enemy[2]-groupShift[1])*drawScaling, startY+(enemy[3]-groupShift[2])*drawScaling, 0, drawScaling*2)
				end
			end
		elseif makingNewEnemy then
			if selection[1] == "catalogEnemy" then
				love.graphics.print("NEW "..string.upper(enemyTypeNames[selection[2]]), 8, 8)
				local enemySize = EnemyClasses[enemyTypeNames[selection[2]]].quadSize or {"00", "00"}
				love.graphics.print("INDEX "..selection[2], 8, 32)
				love.graphics.print("SIZE "..enemySize[1].."-"..enemySize[2], 8, 56)
				local startX = catalogSize*((selection[2]-1)%(576/catalogSize))
				local startY = 100+catalogSize*math.floor((selection[2]-1)*catalogSize/576)
				love.graphics.rectangle("fill", startX, startY, catalogSize, catalogSize)
				drawButton("CONFIRM", 368, 0, 128, 32, {0, 0, 0}, {0, 1, 0})
			else
				love.graphics.print("CHOOSE YOUR NEW ENEMY TYPE", 8, 8)
			end
			drawButton("BACK", 496, 0, 80, 32, {0, 0, 0}, {1, 0, 0})
			
			for index, enemyName in ipairs(enemyTypeNames) do
				local startX = catalogSize*((index-1)%(576/catalogSize))
				local startY = 100+catalogSize*math.floor((index-1)*catalogSize/576)
				love.graphics.rectangle("line", startX, startY, catalogSize, catalogSize)
				local maxSize = math.max(EnemyClasses[enemyName].quadSize[1], EnemyClasses[enemyName].quadSize[2])
				love.graphics.draw(EnemyClasses[enemyName].defaultQuad[1], EnemyClasses[enemyName].defaultQuad[2] or EnemyClasses[enemyName].quads.regular[1], startX, startY, 0, catalogSize/maxSize)
			end
		else
			background:draw("inGame")
			if devSettings.showGrid then
				love.graphics.setColor(1, 1, 1, 0.1)
				local gridOffset = (-cameraX)%(2*snapSize)
				for x=-2,math.floor(576/snapSize) do
					for y=-x%2,math.floor(640/snapSize),2 do
						love.graphics.rectangle("fill", x*snapSize+gridOffset, y*snapSize, snapSize, snapSize)
					end
				end
				love.graphics.setColor(1, 1, 1)
			end
			love.graphics.print("Z-OUTLINES "..string.upper(tostring(devSettings.toggleOutlines)), 100, 25)
			love.graphics.print("CAMERAX "..string.upper(math.floor(cameraX)), 100, 50)
			love.graphics.print("X-PREVIEW "..string.upper(tostring(devSettings.previewMode)), 100, 75)
			
			love.graphics.line(0, 64, 576, 64)
			
			--mousescroll boxes
			love.graphics.setColor(0, 25/64, 1, 0.5)
			love.graphics.rectangle("fill", 0, 320-mouseScrollBounds[1]/2, mouseScrollBounds[2], mouseScrollBounds[1])
			love.graphics.rectangle("fill", 576-mouseScrollBounds[2], 320-mouseScrollBounds[1]/2, mouseScrollBounds[2], mouseScrollBounds[1])
			love.graphics.setColor(0, 0, 0)
			love.graphics.rectangle("line", 0, 320-mouseScrollBounds[1]/2, mouseScrollBounds[2], mouseScrollBounds[1])
			love.graphics.rectangle("line", 576-mouseScrollBounds[2], 320-mouseScrollBounds[1]/2, mouseScrollBounds[2], mouseScrollBounds[1])
			love.graphics.setColor(1, 1, 1)
			love.graphics.draw(pointer.right, 576-mouseScrollBounds[2]/2-8, 314, 0, 2)
			love.graphics.draw(pointer.left, mouseScrollBounds[2]/2-8, 314, 0, 2)
			
			if selection[1] == "gelatoid" then
				if movingItem then
					love.graphics.setColor(1, 0, 0)
				else
					love.graphics.setColor(1, 1, 1)
				end
				love.graphics.rectangle("fill", gelatoid.x-cameraX, gelatoid.y, 64, 32)
				love.graphics.setColor(1, 1, 1)
			end
			if devSettings.toggleOutlines then
				love.graphics.rectangle("line", gelatoid.x-cameraX, gelatoid.y, 64, 32)
			end
			gelatoid:draw()
			
			local displayedEnemies = devSettings.previewMode and loadedEnemies or loadQueue
			if selection[1] == "enemy" then
				for _, a in ipairs(selection[2]) do
					local selectedEnemy = displayedEnemies[a]
					if movingItem then
						love.graphics.setColor(1, 0, 0)
					else
						love.graphics.setColor(1, 1, 1)
					end
					love.graphics.rectangle("fill", selectedEnemy.x-cameraX, selectedEnemy.y, 2*selectedEnemy.quadSize[1], 2*selectedEnemy.quadSize[2])
					love.graphics.setColor(1, 1, 1)
				end
			end
			if devSettings.toggleOutlines then
				for index, enemy in ipairs(displayedEnemies) do
					love.graphics.rectangle("line", enemy.x-cameraX, enemy.y, 2*enemy.quadSize[1], 2*enemy.quadSize[2])
				end
			end
			for index, enemy in ipairs(displayedEnemies) do
				enemy:draw()
			end
			if devSettings.previewMode then
				if selection[1] == "bullet" then
					for _, a in ipairs(selection[2]) do
						local selectedBullet = enemyBullets[a]
						if movingItem then
							love.graphics.setColor(1, 0, 0)
						else
							love.graphics.setColor(1, 1, 1)
						end
						love.graphics.rectangle("fill", selectedBullet.x-cameraX, selectedBullet.y, 2*selectedBullet.quadSize[1], 2*selectedBullet.quadSize[2])
						love.graphics.setColor(1, 1, 1)
					end
				end
				if devSettings.toggleOutlines then
					for index, bullet in ipairs(enemyBullets) do
						love.graphics.rectangle("line", bullet.x-cameraX, bullet.y, 2*bullet.quadSize[1], 2*bullet.quadSize[2])
					end
				end
				for index, bullet in ipairs(enemyBullets) do
					bullet:draw()
				end
			end
			
			if movingItem then
				local mouseX = love.mouse.getX()
				local mouseY = love.mouse.getY()
				local gridOffset = (-cameraX)%snapSize
				local newX = snapSize*math.floor((mouseX-gridOffset)/snapSize)+gridOffset
				local newY = snapSize*math.floor(mouseY/snapSize)
				if selection[1]=="catalogGroup" then
					love.graphics.print("ADDING GROUP OF "..#savedGroups[selection[2]])
				elseif selection[1]=="catalogEnemy" then
					love.graphics.print("ADDING "..string.upper(enemyTypeNames[selection[2]]).." ENEMY")
				elseif selection[1]=="gelatoid" then
					love.graphics.print("MOVING PLAYER")
				elseif #selection[3]==1 then
					love.graphics.print("MOVING "..string.upper(selection[3][1].." "..selection[1]))
				else
					love.graphics.print("MOVING "..#selection[3].." ITEMS")
				end
				if selection[1]=="catalogGroup" then
					local relativePositions = savedGroups[selection[2]]
					love.graphics.setColor(1, 1, 0)
					for i=1,#relativePositions do
						local item = EnemyClasses[relativePositions[i][1]]
						love.graphics.rectangle("fill", relativePositions[i][2]+newX, relativePositions[i][3]+newY, 2*item.quadSize[1], 2*item.quadSize[2])
					end
					love.graphics.setColor(1, 1, 1)
					for i=1,#relativePositions do
						local item = EnemyClasses[relativePositions[i][1]]
						love.graphics.draw(item.defaultQuad[1], item.defaultQuad[2], relativePositions[i][2]+newX, relativePositions[i][3]+newY, 0, 2)
					end
				elseif selection[1]=="catalogEnemy" then
					local selectedItem = EnemyClasses[enemyTypeNames[selection[2]]]
					love.graphics.setColor(1, 1, 0)
					love.graphics.rectangle("fill", newX, newY, 2*selectedItem.quadSize[1], 2*selectedItem.quadSize[2])
					love.graphics.setColor(1, 1, 1)
					--love.graphics.draw(EnemyClasses[enemyName].defaultQuad[1], EnemyClasses[enemyName].defaultQuad[2] or EnemyClasses[enemyName].quads.regular[1], startX, startY, 0, catalogSize/maxSize)
					love.graphics.draw(selectedItem.defaultQuad[1], selectedItem.defaultQuad[2] or selectedItem.quads.regular[1], newX, newY, 0, 2)
				elseif selection[1]=="gelatoid" then
					local oldCoords = {gelatoid.x, gelatoid.y}
					love.graphics.setColor(1, 1, 0)
					love.graphics.rectangle("fill", mouseX<512 and mouseX or 512, mouseY<64 and 64 or mouseY>608 and 608 or mouseY, 64, 32)
					love.graphics.setColor(1, 1, 1)
					gelatoid.x = cameraX + (mouseX<512 and mouseX or 512)
					gelatoid.y = mouseY<64 and 64 or mouseY>608 and 608 or mouseY
					gelatoid:draw()
					gelatoid.x = oldCoords[1]
					gelatoid.y = oldCoords[2]
				else
					local relativePositions = getRelativeGroupPositions()
					love.graphics.setColor(1, 1, 0)
					for i=1,#relativePositions do
						local item = EnemyClasses[relativePositions[i][1]] or BulletClasses[relativePositions[i][1]]
						love.graphics.rectangle("fill", relativePositions[i][2]+newX, relativePositions[i][3]+newY, 2*item.quadSize[1], 2*item.quadSize[2])
					end
					love.graphics.setColor(1, 1, 1)
					for i=1,#relativePositions do
						local item = EnemyClasses[relativePositions[i][1]] or BulletClasses[relativePositions[i][1]]
						love.graphics.draw(item.defaultQuad[1], item.defaultQuad[2], relativePositions[i][2]+newX, relativePositions[i][3]+newY, 0, 2)
					end
				end
			else
				if selection[1] == "gelatoid" then
					drawButton("---", 408, 32, 56, 32, {0, 0, 0}, {0, 1, 0})
					drawButton("MOV", 464, 32, 56, 32, {0, 0, 0}, {1, 1, 0})
					drawButton("---", 520, 32, 56, 32, {0, 0, 0}, {1, 0, 0})
				elseif selection[1] == "enemy" then
					drawButton("DUP", 408, 32, 56, 32, {0, 0, 0}, {0, 1, 0})
					drawButton(devSettings.previewMode and "---" or "MOV", 464, 32, 56, 32, {0, 0, 0}, {1, 1, 0})
					drawButton("DEL", 520, 32, 56, 32, {0, 0, 0}, {1, 0, 0})
				elseif devSettings.previewMode and selection[1] == "bullet" then
					drawButton("MOV", 464, 32, 56, 32, {0, 0, 0}, {1, 1, 0})
					drawButton("DEL", 520, 32, 56, 32, {0, 0, 0}, {1, 0, 0})
				elseif not devSettings.previewMode and selection[1] == "none" then
					drawButton("NEW", 408, 32, 56, 32, {0, 0, 0}, {0, 1, 0})
					drawButton("GROUP", 464, 32, 112, 32, {0, 0, 0}, {0.5, 0, 1})
				end
				if selection[1] == "enemy" and #selection[2]>1 then
					drawButton("EXPORT", 408, 0, 100, 32, {0, 0, 0}, {0, 25/64, 1})
					drawButton("SAVE", 508, 0, 68, 32, {0, 0, 0}, {0.5, 0, 1})
				else
					drawButton("EXPORT", 408, 0, 168, 32, {0, 0, 0}, {0, 25/64, 1})
				end
				
				if selection[1]=="none" then
					love.graphics.print("NO SELECTION")
				elseif selection[1]=="gelatoid" then
					love.graphics.print("SELECTED PLAYER")
				elseif #selection[3]==1 then
					love.graphics.print("SELECTED "..string.upper(selection[3][1].." "..selection[1]))
				else
					love.graphics.print("SELECTED "..#selection[3].." ITEMS")
				end
			end
		end
		love.graphics.print("FPS-"..love.timer.getFPS(), 0, 624)
    end
end

function updateTimer(v, data, dt)
	local newTime = v + data[1]*dt
	if data[3] == "loop" then
		return newTime % data[2]
	elseif data[3] == "once" then
		return math.min(newTime, data[2])
	elseif data[3] == "nocap" then
		return newTime
	end
end

function updateTimers(nameList, timerTable, timerData, dt)
	if nameList=="all" then
		for k,v in pairs(timerTable) do
			timerTable[k] = updateTimer(v, timerData[k], dt)
		end
	else
		for i, name in ipairs(nameList) do
			timerTable[name] = updateTimer(timerTable[name], timerData[name], dt)
		end
	end
end

function updateGlobalTimers(timerNames, dt)
	updateTimers(timerNames, timer, timerData, dt)
end

function updateAudioVolume()
	audioFiles.menuNavigate:setVolume(soundVolume.sfx/6)
	audioFiles.menuSelect:setVolume(soundVolume.sfx/6)
	audioFiles.menuDone:setVolume(soundVolume.sfx/6)
	audioFiles.startGame:setVolume(soundVolume.sfx/6)
	audioFiles.gelatoidTitle:setVolume(soundVolume.music/6)
	audioFiles.stage01Gelato:setVolume(soundVolume.music/6)
end

function updateWithLoadCheck(loadQueue, loadedList, dt)
	local deletedIndices = {}
	for index, item in ipairs(loadQueue) do
		if item:loadCheck() then
			table.insert(loadedList, item)
			table.insert(deletedIndices, index)
			extraDt = item:calculateLoadDelay()
			item:updateAll(extraDt)
		end
	end
	tableRemove(loadQueue, deletedIndices)
end

function updateWithUnloadCheck(objectList, dt)
	local deletedIndices = {}
	for index, item in ipairs(objectList) do
		item:updateAll(dt)
		if item:unloadCheck() then
			table.insert(deletedIndices, index)
		end
	end
	tableRemove(objectList, deletedIndices)
end

function levelEditorUpdateAll(dt)
	cameraX = cameraX + autoscrollSpeed*dt
	gelatoid.x = gelatoid.x + autoscrollSpeed*dt
	background:update(dt)
	for index, enemy in ipairs(loadedEnemies) do
		enemy:updateAll(dt)
	end
	
	local deletedIndices = {}
	for index, bullet in ipairs(enemyBullets) do
		bullet:updateAll(dt)
		if bullet.timer.global<0 or bullet:unloadCheck() then --or bullet:unloadCheck() = less lag, but can't rewind when bullets move off screen
			table.insert(deletedIndices, index)
		end
	end
	if #deletedIndices>0 then
		if selection[1]=="bullet" then
			--DELETED INDICES ARE ALWAYS AT THE END (IN THIS CONTEXT), NO MOVING REQUIRED
			local deletedSelectionIndices = {}
			local i = 1
			for i2, a in ipairs(selection[2]) do
				if a>=deletedIndices[1] then
					deletedSelectionIndices[i] = i2
					i = i + 1
				end
			end
			if #deletedSelectionIndices==#selection[2] then
				selection = {"none"}
			else
				tableRemove(selection[2], deletedSelectionIndices)
				tableRemove(selection[3], deletedSelectionIndices)
			end
		end
		tableRemove(enemyBullets, deletedIndices)
	end
end

if profileMode then
	love.frame = 0
end
function love.update(dt)
    if currentScene == 0 then
		updateGlobalTimers({"starsBlink", "titleMod", "titleFade", "pressFireBlink"}, dt)
		audioFiles.gelatoidTitle:play()
	elseif currentScene == 1 then
		updateGlobalTimers({"starsBlink", "titleMod"}, dt)
		if not startPressed then
			audioFiles.gelatoidTitle:play()
		else
			audioFiles.gelatoidTitle:stop()
			updateGlobalTimers({"startWait"}, dt)
			if timer.startWait == 100 then
				moveScene(3)
				currentMusic = audioFiles.stage01Gelato
			end
		end
	elseif currentScene == 2 then
		updateGlobalTimers({"starsBlink", "titleMod"}, dt)
		audioFiles.gelatoidTitle:play()
	elseif currentScene == 3 then
		currentMusic:play()
		updateGlobalTimers({"gameWait"}, dt)
		if timer.gameWait == 50 then
			cameraX = cameraX + autoscrollSpeed*dt
			background:update(dt)
			updateWithUnloadCheck(loadedEnemies, dt)
			updateWithUnloadCheck(gelatoid.bullets, dt)
			gelatoid:update(dt)
			updateWithUnloadCheck(enemyBullets, dt)
			updateWithLoadCheck(loadQueue, loadedEnemies, dt)
		end
	elseif currentScene == 4 then
		if not makingNewEnemy and not makingNewGroup then
			audioFiles.gelatoidTitle:stop()
			currentMusic:play()
			
			--mouseScroll
			local mouseX = love.mouse.getX()
			local mouseY = love.mouse.getY()
			
			local realDt = 0
			if cameraX>0 and mouseX<mouseScrollBounds[2] and mouseY>320-mouseScrollBounds[1]/2 and mouseY<320+mouseScrollBounds[1]/2 then
				realDt = -dt
			elseif mouseX>576-mouseScrollBounds[2] and mouseY>320-mouseScrollBounds[1]/2 and mouseY<320+mouseScrollBounds[1]/2 then
				realDt = dt
			end
			
			if devSettings.fastScroll then
				realDt = realDt*mouseScrollMult
			end
			
			if cameraX + autoscrollSpeed*realDt < 0 then
				realDt = -cameraX/autoscrollSpeed
			end
			
			if realDt ~= 0 then
				levelEditorUpdateAll(realDt)
			end
		end
	end
	if profileMode then
		love.frame = love.frame + 1
		if love.frame%500 == 0 then
			love.report = love.profiler.report(20)
			print(love.report)
			love.profiler.reset()
		end
	end
end

function love.mousepressed(x, y, button, istouch, presses)
	if currentScene==4 then
		actionClick = false
		if makingNewGroup then
			if x>=496 and y<=32 then
				selection = {"none"}
				makingNewGroup = false
			elseif x>=368 and y<=32 and selection[1]=="catalogGroup" then
				makingNewGroup = false
				movingItem = true
			elseif x>=520 and y<=64 and selection[1]=="catalogGroup" then
				tableRemove(savedGroups, {selection[2]})
				writeDevData()
				selection = {"none"}
			else
				local possibleIndex = 1+math.floor(x/catalog2Size)+(576/catalog2Size)*math.floor((y-100)/catalog2Size)
				if possibleIndex>0 and possibleIndex<=#savedGroups then
					selection = {"catalogGroup", possibleIndex}
				else
					selection = {"none"}
				end
			end
			actionClick = true
		elseif makingNewEnemy then
			if x>=496 and y<=32 then
				selection = {"none"}
				makingNewEnemy = false
			elseif x>=368 and y<=32 and selection[1]=="catalogEnemy" then
				makingNewEnemy = false
				movingItem = true
			else
				local possibleIndex = 1+math.floor(x/catalogSize)+(576/catalogSize)*math.floor((y-100)/catalogSize)
				if possibleIndex>0 and possibleIndex<=#enemyTypeNames then
					selection = {"catalogEnemy", possibleIndex}
				else
					selection = {"none"}
				end
			end
			actionClick = true
		elseif movingItem then
			if selection[1] == "catalogGroup" then
				local gridOffset = (-cameraX)%snapSize
				local newX = snapSize*math.floor((x-gridOffset)/snapSize)+gridOffset
				local newY = snapSize*math.floor(y/snapSize)
				local savedGroup = savedGroups[selection[2]]
				selection = {"enemy", {}, {}}
				for index, enemy in ipairs(savedGroup) do
					local newEnemyX = newX+cameraX+enemy[2]
					local newEnemyY = newY+enemy[3]
					local newEnemy1 = newEnemy(enemy[1], {x=newEnemyX, y=newEnemyY})
					local newEnemy2 = newEnemy(enemy[1], {x=newEnemyX, y=newEnemyY})
					local extraDt = newEnemy2:calculateLoadDelay()
					newEnemy2:updateAll(extraDt)
					table.insert(loadQueue, newEnemy1)
					table.insert(loadedEnemies, newEnemy2)
					table.insert(dupOrigins, -1)
					table.insert(selection[2], #loadQueue)
					table.insert(selection[3], enemy[1])
				end
			elseif selection[1] == "catalogEnemy" then
				local gridOffset = (-cameraX)%snapSize
				local newX = snapSize*math.floor((x-gridOffset)/snapSize)+gridOffset
				local newY = snapSize*math.floor(y/snapSize)
				local newEnemy1 = newEnemy(enemyTypeNames[selection[2]], {x=newX+cameraX, y=newY})
				local newEnemy2 = newEnemy(enemyTypeNames[selection[2]], {x=newX+cameraX, y=newY})
				local extraDt = newEnemy2:calculateLoadDelay()
				newEnemy2:updateAll(extraDt)
				table.insert(loadQueue, newEnemy1)
				table.insert(loadedEnemies, newEnemy2)
				table.insert(dupOrigins, -1)
				selection = {"enemy", {#loadQueue}, {enemyTypeNames[selection[2]]}}
			elseif selection[1] == "gelatoid" then
				local passedDt = cameraX/autoscrollSpeed
				resetLevelEditor(1)
				gelatoid.x = x<512 and x or 512 --levelEditorUpdateAll adds cameraX later
				gelatoid.y = y<64 and 64 or y>608 and 608 or y
				levelEditorUpdateAll(passedDt)
			elseif selection[1] == "enemy" then
				local gridOffset = (-cameraX)%snapSize
				local newX = snapSize*math.floor((x-gridOffset)/snapSize)+gridOffset
				local newY = snapSize*math.floor(y/snapSize)
				--fix with getRelativeGroupPositions
				local relativePositions = getRelativeGroupPositions()
				for index, a in ipairs(selection[2]) do
					local movedStartEnemy = loadQueue[a]
					movedStartEnemy.x = relativePositions[index][2]+newX+cameraX
					movedStartEnemy.y = relativePositions[index][3]+newY
					local newLoadedEnemy = newEnemyFromLevelData(1, dupOrigins[a])
					newLoadedEnemy.x = relativePositions[index][2]+newX+cameraX
					newLoadedEnemy.y = relativePositions[index][3]+newY
					local extraDt = newLoadedEnemy:calculateLoadDelay()
					newLoadedEnemy:updateAll(extraDt)
					loadedEnemies[a] = newLoadedEnemy
				end
			elseif selection[1] == "bullet" then
				local gridOffset = (-cameraX)%snapSize
				local newX = snapSize*math.floor((x-gridOffset)/snapSize)+gridOffset
				local newY = snapSize*math.floor(y/snapSize)
				
				local focusedItem = enemyBullets[selection[2][1]]
				if #selection[2]>1 then
					for i=2,#selection[2] do
						local newItem = enemyBullets[selection[2][i]]
						local currentSum = focusedItem.x + focusedItem.y
						local newSum = newItem.x + newItem.y
						if newSum<currentSum or newSum==currentSum and newItem.x<focusedItem.x then
							focusedItem = newItem
						end
					end
				end
				local shiftX = newX - focusedItem.x + cameraX
				local shiftY = newY - focusedItem.y
				
				for _, a in ipairs(selection[2]) do
					local movedBullet = enemyBullets[a]
					movedBullet.x = movedBullet.x+shiftX
					movedBullet.y = movedBullet.y+shiftY
				end
			end
			actionClick = true
			movingItem = false
		elseif x>=408 and y<=32 then
			if selection[1]=="enemy" and #selection[2]>1 and x>=508 then
				--SAVE (group)
				local relativePositions = getRelativeGroupPositions()
				local isDuplicate = false
				for _, savedGroup in ipairs(savedGroups) do
					if #savedGroup == #relativePositions then
						isDuplicate = true
						for _2, newPosition in ipairs(relativePositions) do
							local isContained = false
							for _3, oldPosition in ipairs(savedGroup) do
								if newPosition[1]==oldPosition[1] and newPosition[2]==oldPosition[2] and newPosition[3]==oldPosition[3] then
									isContained = true
									break
								end
							end
							if not isContained then
								isDuplicate = false
								break
							end
						end
						if isDuplicate then
							break
						end
					end
				end
				if not isDuplicate then
					table.insert(savedGroups, relativePositions)
					writeDevData()
					print("added group to saved groups")
				else
					print("this group is already in saved groups")
				end
			else
				--export
				writeLevelData(1)
				print("new data exported")
			end
			actionClick = true
		elseif selection[1] == "gelatoid" then
			if x>=464 and x<520 and y<=64 then
				--MOV (move)
				movingItem = true
				actionClick = true
			end
		elseif selection[1] == "enemy" then
			if x>=408 and y<=64 then
				actionIndex = math.floor((x-408)/56)+1
				if actionIndex==1 then
					--DUP (duplicate)
					local canDo = true
					for _, a in ipairs(selection[2]) do
						if dupOrigins[a]==-1 then
							print("Export and restart the level editor before duplicating a new enemy")
							canDo = false
							break
						end
					end
					if canDo then
						table.sort(selection[2])
						for i=#selection[2],1,-1 do
							a = selection[2][i]
							duplicateEnemy1 = newEnemyFromLevelData(1, dupOrigins[a])
							duplicateEnemy2 = newEnemyFromLevelData(1, dupOrigins[a])
							duplicateEnemy1.x = loadQueue[a].x
							duplicateEnemy1.y = loadQueue[a].y
							duplicateEnemy2.x = loadQueue[a].x
							duplicateEnemy2.y = loadQueue[a].y
							table.insert(loadQueue, a, duplicateEnemy1)
							extraDt = duplicateEnemy2:calculateLoadDelay()
							duplicateEnemy2:updateAll(extraDt)
							table.insert(loadedEnemies, a, duplicateEnemy2)
							table.insert(dupOrigins, a, dupOrigins[a])
						end
						for i=1,#selection[2] do
							selection[2][i] = selection[2][i] + i-1
						end
					end
				elseif actionIndex==2 and not devSettings.previewMode then
					--MOV (move)
					local canDo = true
					for _, a in ipairs(selection[2]) do
						if dupOrigins[a]==-1 then
							print("Export and restart the level editor before moving a new enemy")
							canDo = false
							break
						end
					end
					if canDo then
						movingItem = true
					end
				elseif actionIndex==3 then
					--DEL (delete)
					tableRemove(loadedEnemies, selection[2])
					tableRemove(loadQueue, selection[2])
					tableRemove(dupOrigins, selection[2])
					selection = {"none"}
				end
				actionClick = true
			end
		elseif devSettings.previewMode and selection[1] == "bullet" then
			if x>=464 and y<=64 then
				actionIndex = math.floor((x-464)/56)+1
				if actionIndex==1 then
					--MOV (move)
					movingItem = true
				elseif actionIndex==2 then
					--DEL (delete)
					tableRemove(enemyBullets, selection[2])
					selection = {"none"}
				end
				actionClick = true
			end
		elseif not devSettings.previewMode and selection[1] == "none" then
			if x>=408 and x<464 and y<=64 then
				--NEW ENEMY
				makingNewEnemy = true
				actionClick = true
			elseif x>=464 and y<=64 then
				--COPY GROUP
				makingNewGroup = true
				actionClick = true
			end
		end
		
		if not actionClick then
			--check if selecting any entities, otherwise deselect
			local holdingShift = love.keyboard.isDown("lshift") or love.keyboard.isDown("rshift")
			if not holdingShift then
				selection = {"none"}
			end
			
			--gelatoid
			if x>=gelatoid.x-cameraX and x<=gelatoid.x-cameraX+64 and y>=gelatoid.y and y<=gelatoid.y+32 then
				selection = {"gelatoid"}
			end
			
			--enemy
			local displayedEnemies = devSettings.previewMode and loadedEnemies or loadQueue
			for index=#displayedEnemies,1,-1 do
				enemy = displayedEnemies[index]
				if x>=enemy.x-cameraX and x<=enemy.x-cameraX+2*enemy.quadSize[1] and y>=enemy.y and y<=enemy.y+2*enemy.quadSize[2] then
					if not holdingShift or selection[1]=="none" then
						selection = {"enemy", {index}, {enemy.enemyType}}
					elseif selection[1]=="enemy" then
						local a = hasValue(index, selection[2])
						if a then
							if #selection[2]==1 then
								selection = {"none"}
							else
								tableRemove(selection[2], {a})
								tableRemove(selection[3], {a})
							end
						else
							table.insert(selection[2], index)
							table.insert(selection[3], enemy.enemyType)
						end
					end
					break
				end
			end
			
			--bullets
			if devSettings.previewMode then
				for index=#enemyBullets,1,-1 do
					bullet = enemyBullets[index]
					if x>=bullet.x-cameraX and x<=bullet.x-cameraX+2*bullet.quadSize[1] and y>=bullet.y and y<=bullet.y+2*bullet.quadSize[2] then
						if not holdingShift or selection[1]=="none" then
							selection = {"bullet", {index}, {bullet.bulletType}}
						elseif selection[1]=="bullet" then
							local a = hasValue(index, selection[2])
							if a then
								if #selection[2]==1 then
									selection = {"none"}
								else
									tableRemove(selection[2], {a})
									tableRemove(selection[3], {a})
								end
							else
								table.insert(selection[2], index)
								table.insert(selection[3], bullet.bulletType)
							end
						end
						break
					end
				end
			end
		end
	end
end

function love.keypressed(key, scancode, isrepeat)
	if currentScene==0 then
		if key == controls.start then
			moveScene(1)
			audioFiles.menuSelect:play()
		end
	elseif currentScene==1 then
		if not startPressed then
			if key == controls.down then
				selection = selection==(devMode and 4 or 3) and (savedGame and 1 or 2) or selection+1
				audioFiles.menuNavigate:play()
			elseif key == controls.up then
				selection = selection==(savedGame and 1 or 2) and (devMode and 4 or 3) or selection-1
				audioFiles.menuNavigate:play()
			elseif key == controls.start or key == controls.fire then
				if selection==1 then
					--you pressed continue
					print("The continue feature doesn't exist yet")
				elseif selection==2 then
					startPressed = true
					audioFiles.startGame:play()
				elseif selection==3 then
					moveScene(2)
					audioFiles.menuSelect:play()
				elseif selection==4 then
					moveScene(4)
					audioFiles.menuSelect:play()
				end
			end
		end
	elseif currentScene==2 then
		if configSection==0 then
			if key == controls.down then
				selection = selection%5 + 1
				audioFiles.menuNavigate:play()
			elseif key == controls.up then
				selection = (selection-2)%5 + 1
				audioFiles.menuNavigate:play()
			elseif key == controls.left then
				if selection==1 then
					if soundVolume.music > 0 then
						soundVolume.music = soundVolume.music - 1
						audioFiles.menuNavigate:play()
					else
						audioFiles.menuDone:play()
					end
				elseif selection==2 then
					if soundVolume.sfx > 0 then
						soundVolume.sfx = soundVolume.sfx - 1
						audioFiles.menuNavigate:play()
					else
						audioFiles.menuDone:play()
					end
				end
				updateAudioVolume()
			elseif key == controls.right then
				if selection==1 then
					if soundVolume.music < 6 then
						soundVolume.music = soundVolume.music + 1
						audioFiles.menuNavigate:play()
					else
						audioFiles.menuDone:play()
					end
				elseif selection==2 then
					if soundVolume.sfx < 6 then
						soundVolume.sfx = soundVolume.sfx + 1
						audioFiles.menuNavigate:play()
					else
						audioFiles.menuDone:play()
					end
				end
				updateAudioVolume()
			elseif key == controls.start or key == controls.fire then
				if selection==1 then
					if soundVolume.music>0 then
						soundVolume.music = 0
						audioFiles.menuNavigate:play()
					else
						soundVolume.music = 6
						audioFiles.menuNavigate:play()
					end
					updateAudioVolume()
				elseif selection==2 then
					if soundVolume.sfx>0 then
						soundVolume.sfx = 0
						audioFiles.menuNavigate:play()
					else
						soundVolume.sfx = 6
						audioFiles.menuNavigate:play()
					end
					updateAudioVolume()
				elseif selection==3 then
					vsyncMode = 1-vsyncMode
					setVsyncMode()
				elseif selection==4 then
					configSection = 1
					audioFiles.menuSelect:play()
					controls = {}
				elseif selection==5 then
					writePlayerSettings()
					moveScene(1)
					selection = 3
					audioFiles.menuDone:play()
				end
			end
		else
			controlList = {"up", "down", "left", "right", "fire", "chill", "start"}
			if hasValue(key, controls) then
				audioFiles.menuDone:play()
			else
				controls[controlList[configSection]] = key
				if configSection < #controlList then
					configSection = configSection + 1
					audioFiles.menuNavigate:play()
				else
					configSection = 0
					audioFiles.menuSelect:play()
				end
			end
		end
	elseif currentScene==3 then
		if key == controls.fire and gelatoid.currentAnimation~="death" and timer.gameWait == 50 then
			if gelatoid.shootTimer>=1/gelatoid.fireRate then
				gelatoid:shootBullet(0, 0, 0)
				gelatoid.shootTimer = 0
				gelatoid.holdingShoot = true
			end
		end
	elseif currentScene==4 then
		if key == controls.fire then
			devSettings.toggleOutlines = not devSettings.toggleOutlines
		elseif key == controls.chill then
			devSettings.previewMode = not devSettings.previewMode
		elseif key == controls.start then
			devSettings.showGrid = not devSettings.showGrid
		elseif key == "c" then
			devSettings.fastScroll = not devSettings.fastScroll
		end
	end
end`
	return useBig ? temp2 : temp1;
}

class NotSupportedError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
}

class Temporary {
	constructor(name, ...components) {
		this.name = name;
		this.components = components;
	}
}

class Block {
	constructor(statements) {
		this.statements = statements;
	}
}

class AssignmentStatement {
	constructor(isLocal, vars, exps) {
		this.isLocal = isLocal;
		this.vars = vars;
		this.exps = exps;
	}
}
class LocalDeclaration {
	constructor(names) {
		this.names = names;
	}
}
class FunctionCallStatement {
	constructor(call) {
		this.call = call;
	}
}
class DoStatement {
	constructor(block) {
		this.block = block;
	}
}
class WhileStatement {
	constructor(exp, block) {
		this.exp = exp;
		this.block = block;
	}
}
class RepeatStatement {
	constructor(block, exp) {
		this.block = block;
		this.exp = exp;
	}
}
class IfStatement {
	constructor(exps, blocks) {
		this.exps = exps;
		this.blocks = blocks;
	}
}
class ForNumericStatement {
	constructor(name, exp1, exp2, exp3, block) {
		this.name = name;
		this.startExp = exp1;
		this.endExp = exp2;
		this.stepExp = exp3;
		this.block = block;
	}
}
class ForGenericStatement {
	constructor(names, exps, block) {
		this.names = names;
		this.exps = exps;
		this.block = block;
	}
}
class FunctionStatement {
	constructor(isLocal, name, hasColon, params, hasVararg, block) {
		this.local = isLocal;
		this.name = name;
		this.colon = hasColon;
		this.params = params;
		this.vararg = hasVararg;
		this.block = block;
	}
}
class ReturnStatement {
	constructor(exps) {
		this.exps = exps;
	}
}
class BreakStatement {}

class NameExpression {
	constructor(name) {
		this.name = name;
	}
}
class BracketExpression {
	constructor(prefix, exp) {
		this.prefix = prefix;
		this.exp = exp;
	}
}
class DotExpression {
	constructor(prefix, name) {
		this.prefix = prefix;
		this.name = name;
	}
}
class FunctionCallExpression {
	constructor(functioncall) {
		this.call = functioncall;
	}
}
class ParenExpression {
	constructor(exp) {
		this.exp = exp;
	}
}
class NilLiteral {}
class BooleanLiteral {
	constructor(value) {
		this.value = value;
	}
}
class NumberLiteral {
	constructor(raw) {
		this.raw = raw;
	}
}
class StringLiteral {
	constructor(raw) {
		this.raw = raw;
	}
}
class VarargExpression {}
class FunctionExpression {
	constructor(params, hasVararg, block) {
		this.params = params;
		this.vararg = hasVararg;
		this.block = block;
	}
}
class TableConstructor {
	constructor(fields) {
		this.fields = fields;
	}
}
class BinaryOperation {
	constructor(exp1, symbol, exp2) {
		this.exp1 = exp1;
		this.symbol = symbol;
		this.exp2 = exp2;
	}
}
class UnaryOperation {
	constructor(symbol, exp) {
		this.symbol = symbol;
		this.exp = exp;
	}
}

class FunctionCall {
	constructor(prefix, hasColon, args) {
		this.prefix = prefix;
		this.colon = hasColon;
		this.args = args;
	}
}

class BracketField {
	constructor(exp1, exp2) {
		this.bracketExp = exp1;
		this.value = exp2;
	}
}
class NameField {
	constructor(name, exp) {
		this.name = name;
		this.value = exp;
	}
}
class ExpField {
	constructor(exp) {
		this.exp = exp;
	}
}

function orderExpression(comps) {
	if (comps.length==1) {
		return comps[0]
	}
	
	let i=comps.length-1;
	while (i>=0) {
		if (comps[i]=='not' || comps[i]=='#' || (comps[i]=='-' && (i==0 || typeof comps[i-1]==='string'))) {
			comps.splice(i, 2, new UnaryOperation(comps[i], comps[i+1]))
		} else if (comps[i]=='^') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		}
		i--;
	}

	var symbols = ['*', '/', '%']
	i = 0;
	while (i<comps.length) {
		if (symbols.includes(comps[i])) {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		} else {
			i++;
		}
	}

	symbols = ['+', '-']
	i = 0;
	while (i<comps.length) {
		if (symbols.includes(comps[i])) {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		} else {
			i++;
		}
	}

	i=comps.length-1;
	while (i>=0) {
		if (comps[i]=='..') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], '..', comps[i+1]))
		}
		i--;
	}

	symbols = ['<', '>', '<=', '>=', '~=', '==']
	i = 0;
	while (i<comps.length) {
		if (symbols.includes(comps[i])) {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		} else {
			i++;
		}
	}

	i = 0;
	while (i<comps.length) {
		if (comps[i]==='and') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], 'and', comps[i+1]))
		} else {
			i++;
		}
	}

	i = 0;
	while (i<comps.length) {
		if (comps[i]==='or') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], 'or', comps[i+1]))
		} else {
			i++;
		}
	}

	return comps[0]
}

function castAST(segment) {
	var type = segment.type;
	var components = segment.subsegments.map(s => (s instanceof Segment) ? castAST(s) : s);
	switch (type) {
		case "Block":
			return new Block(components)
		case "Identifier":
			return new Temporary("Name", components[0].raw)
		case "NumberLiteral":
			return new NumberLiteral(components[0].raw)
		case "NameVar":
			return new NameExpression(components[0].components[0])
		case "BracketVar":
			return new BracketExpression(components[0], components[1].components[0])
		case "DotVar":
			return new DotExpression(components[0], components[2].components[0])
		case "BracketExp":
			return new Temporary(type, components[1])
		case "VarPrefixexp":
		case "PrefixexpExpression":
		case "PrimitiveExpression":
		case "TableConstructorExp":
			return components[0]
		case "FunctionCallPrefixexp":
			return new FunctionCallExpression(components[0])
		case "ParenExpPrefixexp":
			return new ParenExpression(components[1])
		case "UnorderedOperatorExpression":
			return orderExpression(components.map(c => (c instanceof Token) ? c.raw : (c instanceof Temporary) ? c.components[0] : c))
		case "BinOpSymbol":
			return new Temporary(type, components[0].raw)
		case "UnOpSymbol":
			return new Temporary(type, components[0].raw)
		case "StringLiteral":
			return new StringLiteral(components[0].raw)
		case "Explist":
		case "Varlist":
		case "FieldList":
			return new Temporary(type, ...components.filter((elem, i) => !(i%2)))
		case "NameList":
			return new Temporary(type, ...components.filter((elem, i) => !(i%2)).map(c => c.components[0]))
		case "FuncName":
			if (components.length==1) {
				return new Temporary(type, false, components[0].components[0])
			}
			var hasColon = components[components.length-2].raw==":";
			return new Temporary(type, hasColon, ...components.filter((elem, i) => !(i%2)).map(c => c.components[0]))
		case "FuncParams":
			if (components.length==2) {
				return new Temporary('Parlist', false)
			}
			return components[1]
		case "TableConstructor":
			if (components.length==2) {
				return new TableConstructor([])
			}
			return new TableConstructor(components[1].components)
		case "OnlyVarargParlist":
			return new Temporary('Parlist', true)
		case "VarargParlist":
			return new Temporary('Parlist', true, ...components[0].components)
		case "NoVarargParlist":
			return new Temporary('Parlist', false, ...components[0].components)
		case "AssignmentStatement":
			return new AssignmentStatement(false, components[0].components, components[2].components)
		case "LocalAssignmentStatement":
			return new AssignmentStatement(true, components[1].components, components[3].components)
		case "EmptyParenArgs":
			return new Temporary("Args")
		case "ExplistArgs":
			return new Temporary("Args", ...components[1].components)
		case "FieldSep":
			return new Temporary(type)
		case "BracketExp":
			return new components[1]
		case "BracketField":
			return new BracketField(components[0], components[2])
		case "NameField":
			return new NameField(components[0].components[0], components[2])
		case "ExpField":
			return new ExpField(components[0])
		case "FunctionBody":
			return new Temporary(type, components[0], components[1])
		case "NoColonFunctionCall":
			return new FunctionCall(components[0], null, components[1].components)
		case "ColonFunctionCall":
			return new FunctionCall(components[0], components[2].components[0], components[3].components)
		case "FunctionCallStatement":
			return new FunctionCallStatement(components[0])
		case "NonLocalFunctionStatement":
			var funcname = components[1].components;
			var funcbody = components[2].components;
			var hasColon = funcname[0];
			var trueName = hasColon ? funcname.slice(1,-1) : funcname.slice(1);
			var colon = hasColon ? funcname[funcname.length-1] : null;
			var hasVararg = funcbody[0].components[0];
			var params = funcbody[0].components.slice(1);
			var body = funcbody[1];
			return new FunctionStatement(false, trueName, colon, params, hasVararg, body);
		case "ForNumericNoStepStatement":
			return new ForNumericStatement(components[1].components[0], components[3], components[5], new NumberLiteral('1'), components[7])
		case "ForNumericStepStatement":
			return new ForNumericStatement(components[1].components[0], components[3], components[5], components[7], components[9])
		case "ForGenericStatement":
			return new ForGenericStatement(components[1].components, components[3].components, components[5])
		case "WhileStatement":
			return new WhileStatement(components[1], components[3])
		case "ReturnStatement":
			if (components.length==1) {
				return new ReturnStatement([])
			}
			return new ReturnStatement(components[1].components)
		case "BreakStatement":
			return new BreakStatement()
		case "IfStatement":
			var newComps = components.filter((elem, i) => i%2);
			return new IfStatement(newComps.filter(c => !(c instanceof Block)), newComps.filter(c => c instanceof Block))
		case "FunctionExpression":
			var funcbody = components[1].components;
			var hasVararg = funcbody[0].components[0];
			var params = funcbody[0].components.slice(1);
			var body = funcbody[1];
			return new FunctionExpression(params, hasVararg, body);
		case "LocalFunctionStatement":
			var funcbody = components[3].components;
			var hasVararg = funcbody[0].components[0];
			var params = funcbody[0].components.slice(1);
			var body = funcbody[1];
			return new FunctionStatement(true, [components[2].components[0]], null, params, hasVararg, body);
		case "DoStatement":
			return new DoStatement(components[1])
		case "VarArgExpression":
			return new VarargExpression()
		case "TableConstructorArgs":
			return new Temporary("Args", components[0])
		case "StringArgs":
			return new Temporary("Args", components[0])
		case "LocalDeclaration":
			return new LocalDeclaration(components[1].components)
		default:
			throw new NotSupportedError(`Bad segment type: ${type}`)
	}
}

function translate() {
	console.log(parsingStorage.result);
	var ast = castAST(parsingStorage.result);
	console.log(ast);
}

function parseTest() {
	readLua('main.lua').then(tokenize).then((tokens) => {
		setupParse(tokens, 30, (numSubs, timeElapsed) => {
			print(parsingStorage.doneParsing ? "1 token" : `${parsingStorage.astTokens.length} tokens`, '|', `${numSubs} subs (${parsingStorage.totalSubs} total)`, '|', `${timeElapsed.toFixed(4)} secs`)
		}, () => {
			translate();
		});
		parse();
	})
}