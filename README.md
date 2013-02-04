imgpipes
========
Image manipulation web server. Apply a list of effects to target image.

Installation:
-------------
- Install node.js
- Clone the project
- `npm install`
- `foreman start`

Examples:
------
See [web.js](https://github.com/sgtFloyd/imgpipes/blob/master/web.js) for a list of all available effects.

Original: `/?url=https://raw.github.com/sgtFloyd/imgpipes/master/examples/lena.png`  
![](https://raw.github.com/sgtFloyd/imgpipes/master/examples/lena.png)

`&fx=explode`  
![](https://raw.github.com/sgtFloyd/imgpipes/master/examples/explode.png)

`&fx=pixelate`  
![](https://raw.github.com/sgtFloyd/imgpipes/master/examples/pixelate.png)

`&fx=swirl,paint`  
![](https://raw.github.com/sgtFloyd/imgpipes/master/examples/swirl_paint.png)

`&fx=greyscale,polaroid`  
![](https://raw.github.com/sgtFloyd/imgpipes/master/examples/greyscale_polaroid.png)

`&fx=implode,negate`  
![](https://raw.github.com/sgtFloyd/imgpipes/master/examples/implode_negate.png)
