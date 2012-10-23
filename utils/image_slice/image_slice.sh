#!/bin/bash
rm -r output
mkdir output
cd input
FILES=*
size=500

for file in $FILES 
do
	purename="${file%.*}"
	width=$(identify -format '%w' $file) 
	height=$(identify -format '%h' $file) 
	for x in $(seq 0 $size $width)
	do
		for y in $(seq 0 $size $height)
		do
			#echo $x $y
			name="../output/$purename"_"$(($x/$size))_$(($y/$size)).png"
			convert $file -crop "$size"x"$size"+"$x"+"$y" $name
			colspace=$(identify -verbose $name | grep Colorspace)
			if [ "$colspace" = "  Colorspace: Gray" ]; then
				rm $name
			fi
		done
	done
done

#convert pic.png -crop 400x400+1200+1600 pic_5_4.png
