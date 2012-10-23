#!/bin/bash
cd output
echo "" > anims.txt
FILES=*
for file in $FILES 
do
purename="${file%.*}"
prefix="${purename%_*}"
  # take action on each file. $f store current file name
  echo "<sprite name='$purename'>" >> anims.txt
  echo "<animation sheet='$purename'/>" >>anims.txt
  echo "</sprite>" >>anims.txt
done

for f in $FILES 
do

purename="${f%.*}"
  # take action on each file. $f store current file name
  
  echo "<asset name='$purename' type='graphic'>$f</asset>" >> anims.txt
done
