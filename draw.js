/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("curveland")
var ctx = canvas.getContext("2d")
let points = []
let modes = ["b", "t", "c", "p"];

let curveNodes = [];
let normals = [];

var curFrame;

let modeIndex = 0
let curMode = modes[modeIndex];
var randomCounter = 0;

const Bstep = 0.005;
const Cstep = 2;
const Tstep = 4;
const Pstep = 1;
const PRes = 1;

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

let v1;
let v2;
let f1;
let f2;
let r1;
let r2;
let a;

let pT = 0;

let p1Rotation;

let debug;
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

function pointLineDist(point, line) {
    return Math.sqrt((line[1] + line[0] * point.x - point.y) ** 2 / (line[0] ** 2 + 1))
}

function pointPointDist(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}

function parabolaLength(a, lower, upper) {
    return ((Math.asinh(2 * a * upper) + 2 * a * upper * Math.sqrt((2 * a * upper) ** 2 + 1)) - (Math.asinh(2 * a * lower) + 2 * a * lower * Math.sqrt((2 * a * lower) ** 2 + 1))) / (4 * a);
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

        case "p":
            string = string.concat("?????");
            break;
        
    }

    ctx.font = "30px Arial";
    ctx.fillText(string, 20, canvas.height - 20);

    pT = 0;
    


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

function cycloidNext(center, point, direct) {
    let d = getDir(center, point);
    let vecToCenter = getDir(points[0], center);
    let rotation = Cstep / r * Math.sign(Math.atan2(vecToCenter.x * direct.y - vecToCenter.y * direct.x, vecToCenter.x * direct.x + vecToCenter.y + direct.y));
    center.x += (direct.x * Cstep);
    center.y += (direct.y * Cstep);
    let newPt = new Point(center.x + Math.cos(rotation) * d.x * r - Math.sin(rotation) * d.y * r, center.y + Math.sin(rotation) * d.x * r + Math.cos(rotation) * d.y * r);
    return [center, newPt, new Point(newPt.x - point.x, newPt.y - point.y)];
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

function getParaPt(a, i, theta, vertex) {
    return new Point(a * i ** 2 * Math.sin(theta) + i * Math.cos(theta) + vertex.x, a * i ** 2 * Math.cos(theta) - i * Math.sin(theta) + vertex.y)
}

function drawParabola(vertex, focus, range) {
    let paraPts = [];
    let a = 1/(4 * pointPointDist(vertex, focus));
    let theta = Math.PI/2 - Math.atan2(focus.y - vertex.y, focus.x - vertex.x);

    for (let i = range[0]; i < range[1]; i += PRes) {
        paraPts.push(getParaPt(a, i, theta, vertex));
    }

    drawPoly(paraPts);

    return [theta, a];
}

function Pframe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPoly(curveNodes)
    drawParabola(v1, f1, [-1000, 1000])
    drawParabola(v2, f2, [-1000, 1000]);
    drawPt(v2.x, v2.y, 5);

    let v = new Point(-2 * a * pT * Math.sin(r1) - Math.cos(r1), -2 * a * pT * Math.cos(r1) + Math.sin(r1));
    console.log(v)
    let curPt = getParaPt(a, pT, r1, v1);
    debug = curPt;

    let a2tangent = r1 - (Math.PI/2 - Math.atan2(v.y, v.x));

    r2 = r1 - 2 * a2tangent;


    let a2Pt = r1 - (Math.PI/2 - Math.atan2(getDir(v1, curPt).y, getDir(v1, curPt).x));
    let d2Pt = pointPointDist(v1, curPt);

    let d2V = Math.sqrt(2 * d2Pt ** 2 * (1 - Math.cos(2 * (a2Pt - a2tangent))))
    console.log(d2V, a2Pt * 180 / Math.PI, a2tangent * 180/Math.PI, a2tangent);
    let a2V = -Math.atan2(v.y, v.x);

    console.log(a2V * 180 / Math.PI);

    //let vecRotation = (Math.PI - 2 * (a2Pt - a2tangent));

    //let newAngle = a2Pt + vecRotation;
    //console.log(vecRotation, newAngle, a2Pt, a2tangent);

    v2 = new Point(v1.x + d2V * Math.cos(Math.PI/2 - a2V), v1.y + d2V * Math.sin(Math.PI/2 - a2V))
    curveNodes.push(v2);

    f2 = new Point(v2.x + 1/(4 * a) * Math.cos(Math.PI / 2 - r2), v2.y + 1/(4 * a) * Math.sin(Math.PI / 2 - r2));

    pT -= Pstep * Math.sqrt(1 - pT)/10;
    curFrame = window.requestAnimationFrame(Pframe);

}
/*
conditions:
arc length of two parabolas fr. vertex to point is equal
parabolas are tangent at point
*/

function getNewParabola() {

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
                            r = pointLineDist(points[2], getLineEq(points[0], points[1]));
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
                    break;
                
                case "p":
                    if (points.length < 2) {
                        points.push(new Point(event.x, event.y));
                        drawPt(event.x, event.y, 5);

                        if (points.length == 2) {
                            v1 = new Point(points[0].x, points[0].y);
                            v2 = new Point(points[0].x, points[0].y);
                            f1 = new Point(points[1].x, points[1].y);
                            f2 = new Point(2 * points[0].x - points[1].x, 2 * points[0].y - points[1].y);

                            drawPt(f2.x, f2.y, 5);

                            

                            [r1, a] = drawParabola(v1, f1, [-1000, 1000]);
                            r2 = drawParabola(v2, f2, [-1000, 1000])[0];
                        }
                    }
                    break;
                    

        }
    }

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
                
                case "p":
                    if (points.length == 2) {
                        drawing = true;
                        Pframe();
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

                    case "p":
                        Pframe();
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