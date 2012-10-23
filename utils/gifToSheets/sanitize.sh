rm -r input_sanitized
cp -r input input_sanitized
gimp -i -b '(sprite-sheet-sanitize "input_sanitized/*.gif")' -b '(gimp-quit 0)'

