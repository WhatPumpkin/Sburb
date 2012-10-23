#!/bin/bash
cd output
echo "" > anims.txt
FILES=*
for file in $FILES 
do
purename="${file%.*}"
prefix="${purename%_*}"
  # take action on each file. $f store current file name
  echo "<animation name='$purename' class='$prefix-dialog' sheet='$purename' />" >> anims.txt
done

for f in $FILES 
do

purename="${f%.*}"
  # take action on each file. $f store current file name
  
  echo "<asset name='$purename' type='graphic'>$f</asset>" >> anims.txt
done
