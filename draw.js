/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("curveland")
var ctx = canvas.getContext("2d")
let points = []
let modes = ["b", "t", "c"];

let curveNodes = [];
let normals = [];

var curFrame;

let modeIndex = 0
let curMode = modes[modeIndex];
var randomCounter = 0;

const Bstep = 0.005;
const Cstep = 2;
const Tstep = 4;

let drawing = false;
var paused = false;

let dog;
let owner;
let dir;

let otherDog;
let otherOwner;
let otherDir;


let r;
let cycPt;
let center;

let otherCycPt;
let otherCenter;



function drawPoly(points, transparent = false) {
    for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        if (transparent) {
            ctx.strokeStyle = "#00000020";
        }
        else {
            ctx.strokeStyle = "black";
        }
        ctx.setLineDash([0])
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
    }
}

function drawNormals() {
    for (let l = 0; l < normals.length; l++) {
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#FF000040";
        drawLine(normals[l][0], normals[l][1]);
    }
}

function getDir(p1, p2) {
    return new Point((p2.x - p1.x) / ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) ** 0.5, (p2.y - p1.y)/((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) ** 0.5)
}

function drawPt(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.fill();
    ctx.stroke();
}

function drawLine(p1, p2) {
    let lineDir = getDir(p1, p2);
    let maxDim = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

    ctx.moveTo(p1.x - lineDir.x *  maxDim, p1.y - lineDir.y * maxDim);
    ctx.lineTo(p1.x + lineDir.x * maxDim, p1.y + lineDir.y * maxDim);
    ctx.stroke();
}

function getLineEq(p1, p2) {
    let dir = getDir(p1, p2);
    let m = dir.y/dir.x;

    let b = p1.y - m * p1.x;

    return [m, b]

}

function getDist(point, line) {
    return Math.sqrt((line[1] + line[0] * point.x - point.y) ** 2 / (line[0] ** 2 + 1))
}

function lerp(p1, p2, weight) {
    return new Point(p1.x * weight + p2.x * (1-weight), p1.y * weight + p2.y * (1-weight));
}


function resetCanvas() {
    if (curFrame) {
        cancelAnimationFrame(curFrame);
    }
    points = [];
    curveNodes = [];
    normals = [];
    drawing = false;
    paused = false;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let string = "Draw Mode: "
    switch (curMode) {
        case "b":
            string = string.concat("Bezier");
            break;
        
        case "t":
            string = string.concat("Tractrix");
            break;

        case "c":
            string = string.concat("Cycloid");
            break;
        
    }

    ctx.font = "30px Arial";
    ctx.fillText(string, 20, canvas.height - 20);


    


}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

//{1,2,, 3,4,, 5,6}
//

function bezierPt(p, weight) {
    let newList = [];
    let lines = []
    while (p.length > 1) {
        for (var j = 0; j < p.length - 1; j++) {
            newList.push(lerp(p[j], p[j + 1], weight))
            lines.push([p[j], p[j + 1]])
        }
        p = newList;
        newList = [];
    }
    return [p[0], lines];
}

function tractrixNext(pull, follow, direct) {

    let t = Math.atan2(pull.y - follow.y, follow.x - pull.x) - Math.atan2(-direct.y, direct.x);
    let dist = ((follow.x - pull.x) ** 2 + (follow.y - pull.y) ** 2) ** 0.5;
    let a = Math.PI - t - Math.asin(Tstep * Math.sin(t)/dist)
    let move = dist * (1 - Math.sin(a)/Math.sin(t));

    let followDir = getDir(follow, pull);


    
    pull.x = pull.x + direct.x * Tstep;
    pull.y = pull.y + direct.y * Tstep;


    follow.x = follow.x + followDir.x * move;
    follow.y = follow.y + followDir.y * move;


    return [pull, follow, followDir];


}

function cycloidNext(center, point, direct) {
    let d = getDir(center, point);
    let vecToCenter = getDir(points[0], center);
    let rotation = Cstep / r * Math.sign(Math.atan2(vecToCenter.x * direct.y - vecToCenter.y * direct.x, vecToCenter.x * direct.x + vecToCenter.y + direct.y));
    center.x += (direct.x * Cstep);
    center.y += (direct.y * Cstep);
    let newPt = new Point(center.x + Math.cos(rotation) * d.x * r - Math.sin(rotation) * d.y * r, center.y + Math.sin(rotation) * d.x * r + Math.cos(rotation) * d.y * r);
    return [center, newPt, new Point(newPt.x - point.x, newPt.y - point.y)];
}

window.onresize = resetCanvas;

resetCanvas();


canvas.onclick = function(event) {
    
    if (!drawing) {

        switch (curMode) {
            case "b": 
                drawPt(event.x, event.y, 5)

                if (points.length > 0) {
                    ctx.beginPath();
                    ctx.setLineDash([0]);
                    ctx.moveTo(points[0].x, points[0].y);
                    ctx.lineTo(event.x, event.y);
                    ctx.stroke();
                }

                
                points.unshift(new Point(event.x, event.y));
                break;

            case "t":
                if (points.length < 3) {
                    drawPt(event.x, event.y, 5);
                    points.push(new Point(event.x, event.y))

                    if (points.length == 2) {
                        ctx.beginPath();
                        ctx.setLineDash([15, 5]);
                        drawLine(points[0], points[1]);
                    }

                    if (points.length == 3) {
                        dog = new Point(points[2].x, points[2].y);
                        owner = new Point(points[0].x, points[0].y);
                        dir = getDir(points[0], points[1]);

                        otherDog = new Point(dog.x, dog.y);
                        otherOwner = new Point(owner.x, owner.y);
                        otherDir = getDir(points[1], points[0]);
                    }
                }
                break;
            
                case "c":
                    if (points.length < 3) {
                        
                        points.push(new Point(event.x, event.y));

                        if (points.length == 2) {
                            ctx.beginPath();
                            ctx.setLineDash([15, 5]);
                            drawLine(points[0], points[1]);
                            drawPt(event.x, event.y, 5);

                            dir = getDir(points[0], points[1])
                            otherDir = getDir(points[1], points[0]);
                        }

                        else if (points.length == 3) {
                            ctx.beginPath();
                            r = getDist(points[2], getLineEq(points[0], points[1]));
                            ctx.setLineDash([0]);
                            ctx.arc(points[2].x, points[2].y, r, 0, 2 * Math.PI);
                            ctx.stroke();

                            center = new Point(points[2].x, points[2].y);
                            otherCenter = new Point(points[2].x, points[2].y);
                        }

                        drawPt(points[points.length - 1].x, points[points.length - 1].y, 5);
                    }

                    else if (points.length == 3) {
                        let dirToClick = getDir(points[2], new Point(event.x, event.y));
                        cycPt = new Point(points[2].x + dirToClick.x * r, points[2].y + dirToClick.y * r);
                        otherCycPt = new Point(points[2].x + dirToClick.x * r, points[2].y + dirToClick.y * r);
                        points.push(cycPt);
                        drawPt(points[points.length - 1].x, points[points.length - 1].y, 5);
                    }
                    

        }
    }

}

let i = 0;


function Bframe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoly(curveNodes);
    drawPoly(points, transparent = true);

    for (let i = 0; i < points.length; i++) {
        drawPt(points[i].x, points[i].y, 5);
    }

    let newData = bezierPt(points, i)

    for (let i = 0; i < newData[1].length; i++) {
        ctx.beginPath();
        ctx.lineWidth = 0.2;
        ctx.moveTo(newData[1][i][0].x, newData[1][i][0].y);
        ctx.lineTo(newData[1][i][1].x, newData[1][i][1].y);
        ctx.stroke();
    }
    
    if (newData[0]) {
        curveNodes.push(newData[0]);
    }
    
    // drawPt(newPoint.x, newPoint.y, 1);
    if (i > 1) {
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.moveTo(curveNodes[curveNodes.length - 2].x, curveNodes[curveNodes.length - 2].y);
        ctx.lineTo(curveNodes[curveNodes.length - 1].x, curveNodes[curveNodes.length - 1].y);
        ctx.stroke();
        return
    }
    i += Bstep
    curFrame = window.requestAnimationFrame(Bframe);
}



function Tframe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoly(curveNodes.slice(0, Math.floor(curveNodes.length/2)), transparent = true);
    drawPoly(curveNodes.slice(Math.floor(curveNodes.length/2) - 1, curveNodes.length));

    drawNormals();

    ctx.beginPath();
    ctx.setLineDash([15, 5]);
    ctx.strokeStyle = "black";
    drawLine(points[0], points[1]);


    ctx.beginPath();
    ctx.setLineDash([0])
    drawPt(dog.x, dog.y, 5);
    drawPt(owner.x, owner.y, 5);
    ctx.moveTo(dog.x, dog.y);
    ctx.lineTo(owner.x, owner.y);
    ctx.stroke();



    let newPts = tractrixNext(owner, dog, dir);
    owner = newPts[0];
    dog = newPts[1];
    curveNodes.push(new Point(dog.x, dog.y));
    
    if (randomCounter == 0) {
        normals.push([new Point(dog.x, dog.y), new Point(dog.x - newPts[2].y, dog.y + newPts[2].x)]);
    }


    let newOtherPts = tractrixNext(otherOwner, otherDog, otherDir);
    otherOwner = newOtherPts[0];
    otherDog = newOtherPts[1];
    curveNodes.unshift(new Point(otherDog.x, otherDog.y));


 
    if (randomCounter % 5 == 0 && randomCounter != 0) {
        normals.push([new Point(dog.x, dog.y), new Point(dog.x - newPts[2].y, dog.y + newPts[2].x)]);
        normals.unshift([new Point(otherDog.x, otherDog.y), new Point(otherDog.x - newOtherPts[2].y, otherDog.y + newOtherPts[2].x)]);
    }
    randomCounter++; 
    curFrame = window.requestAnimationFrame(Tframe);
}

function Cframe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoly(curveNodes.slice(0, Math.floor(curveNodes.length/2)), transparent = true);
    drawPoly(curveNodes.slice(Math.floor(curveNodes.length/2) - 1, curveNodes.length));

    drawNormals();

    ctx.beginPath();
    ctx.setLineDash([15, 5]);
    ctx.strokeStyle = "black";
    drawLine(points[0], points[1]);

    


    let newPts = cycloidNext(center, cycPt, dir);
    center = newPts[0];
    cycPt = newPts[1];

    let newOtherPts = cycloidNext(otherCenter, otherCycPt, otherDir);
    otherCenter = newOtherPts[0];
    otherCycPt = newOtherPts[1];

    curveNodes.unshift(otherCycPt);



    drawPt(center.x, center.y, 5);
    drawPt(cycPt.x, cycPt.y, 5);

    ctx.beginPath();
    ctx.setLineDash([0]);
    ctx.arc(center.x, center.y, r, 0, 2 * Math.PI);
    ctx.stroke();
    
    curveNodes.push(cycPt);
    
    if (randomCounter == 0) {
        normals.push([new Point(cycPt.x, cycPt.y), new Point(cycPt.x - newPts[2].y, cycPt.y + newPts[2].x)]);
    }


 
    if (randomCounter % 5 == 0 && randomCounter != 0) {
        normals.push([new Point(cycPt.x, cycPt.y), new Point(cycPt.x - newPts[2].y, cycPt.y + newPts[2].x)]);
        normals.unshift([new Point(otherCycPt.x, otherCycPt.y), new Point(otherCycPt.x - newOtherPts[2].y, otherCycPt.y + newOtherPts[2].x)]);
    }
    randomCounter++;
    curFrame = window.requestAnimationFrame(Cframe);
}



window.onkeydown = function(event) {
    if (event.key == " ") {
        if (!drawing) {
            i = 0;
            switch (curMode) {
                case "b":
                    if (points.length > 1) {
                        drawing = true;
                        Bframe();
                    }
                    break;
                
                case "t":
                    if (points.length == 3) {
                        drawing = true;
                        Tframe();
                    }
                    break;
                
                case "c":
                    if (points.length == 4) {
                        drawing = true;
                        Cframe();
                    }

                    break;
            }
        }

        else {
            if (!paused) {
                paused = true;
                cancelAnimationFrame(curFrame);
            }
    
            else {
                paused = false;
                switch (curMode) {
                    case "b":
                        Bframe();
                        break;
                    
                    case "t":
                        Tframe();
                        break;
                    
                    case "c":
                        Cframe();
                        break;
                }
            }
        }
    }

    if (event.key == "ArrowRight") {
        modeIndex = (modeIndex + 1) % modes.length;
        curMode = modes[modeIndex];
        resetCanvas();    
    }

    if (event.key == "ArrowLeft") {
        modeIndex = (modeIndex - 1 + modes.length) % modes.length;
        curMode = modes[modeIndex];
        resetCanvas();
    }     
    

}