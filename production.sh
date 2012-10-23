cat Iuppiter.js modernizr.js Jterniabound.js Sprite.js Fighter.js Character.js SpriteButton.js Animation.js Room.js FontEngine.js Action.js events.js Trigger.js commands.js serialization.js Dialoger.js Chooser.js Audio.js Assets.js Debugger.js Path.js ActionQueue.js > Sburb.js
./jsmin < Sburb.js > Sburb.min.js
cp index.html index_dev.html
rm index.html
cp index_production.html index.html
zip -r Jterniabound.zip Sburb.min.js index.html README-ownership-liscensing.txt resources levels 
rm Sburb.js
rm Sburb.min.js
rm index.html
cp index_dev.html index.html
rm index_dev.html
