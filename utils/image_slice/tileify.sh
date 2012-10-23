#!/bin/bash
cd output
echo "" > anims.txt
FILES=*_*
for file in $FILES 
do
	purename="${file%.*}"
	prefix="${purename%_*}"
	size=1000
	row=$(echo "$purename" | cut -d _ -f 2)
	col=$(echo "$purename" | cut -d _ -f 3)
	x=$(($col*$size))
	y=$(($row*$size))
  # take action on each file. $f store current file name
  echo "<sprite name='$purename' x='$x' y='$y'/>" >> anims.txt
done

for f in $FILES 
do

purename="${f%.*}"

  # take action on each file. $f store current file name
  
  echo "<asset name='$purename' type='graphic'>$f</asset>" >> anims.txt
done
