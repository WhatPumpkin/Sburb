#!/bin/bash
rm -r output
cp -r input_sanitized output
gimp -i -b '(sprite-sheet-batch "output/*.gif")' -b '(gimp-quit 0)'
rm output/*.gif
