
//import { transform } from 'lodash';
import './App.css';
import {useState, useRef, useEffect} from 'react'
import { CompactPicker } from 'react-color';
//import cloneDeep from 'lodash/cloneDeep';

function getTextDimensions(text, font, fontSize) { //AHHH
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${font}`;
  const textMetrics = context.measureText(text);
  const width = textMetrics.width;
  const height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
  // Remove the canvas from the DOM
  canvas.remove()
  return { width, height };
}

// constant functions
function createElement(type, x, y, x2, y2, id, file = null, text = null, color = null){ //create element to store in elements array
  const width = x2 - x //width
  const height = y2 - y //height
  if (type === 'image'){
    return {type, x, y, x2, y2, width, height, id, file, text}
  }
  else if (type === 'text'){
    return {type, x, y, width, height, id, text}
  }
  else if (type === 'arrowText' || type === 'arrowText2'){
    return {type, x, y, width, height, x2, y2, id, text, color}
  }
  else{ //rect and line and arrow
    return {type, x, y, width, height, x2, y2, id, text: '', color}
  } //line amd arrow uses x, y, x2, y2, but x and y is x1, y1 in e.event.target
  //rect and image uses x, y, height, width
}

function handleDragOver(e){ //when something (image) is being dragged on canvas
  e.preventDefault() //skips the image opening on new tab
}

function findRectangleEle(elements, x, y, x2, y2){ //find if the line/arrow touched, only for one rectangle, do for two later
  const eleRect = []
  for (const ele of elements){
    if (ele.type === 'rectangle' || ele.type === 'image' || ele.type === 'text'){
      const tarX = ele.x - 50
      const tarY = ele.y - 50
      const tarHeight = ele.height + 100
      const tarWidth = ele.width + 100
      
      if ((tarX < x && x < tarX + tarWidth && tarY < y && y < tarY + tarHeight)){ //point1 x, y
        eleRect.push(ele)
      }
      else if (tarX < x2 && x2 < tarX + tarWidth && tarY < y2 && y2 < tarY + tarHeight){ //point2, x, y
        eleRect.push(ele)
      }
    }
  }
  return eleRect.length === 0 ? null : eleRect
}

function findLineEle(elements, newX, newY, width, height){//find ALL lines/arrows that are in the rectangle touched zone 
  const linesfound = []
  const tarX = newX - 50
  const tarY = newY - 50
  const tarHeight = height + 100
  const tarWidth = width + 100
  for (const ele of elements){
    if (ele.type === 'line' || ele.type === 'arrow' || ele.type === "arrowText" || ele.type === 'arrowText2'){
      if (tarX < ele.x && ele.x < tarX + tarWidth && tarY < ele.y && ele.y < tarY + tarHeight){ //point 1
        linesfound.push({ele, point: 1})
      } 
      else if (tarX < ele.x2 && ele.x2 < tarX + tarWidth && 
      tarY < ele.y2 && ele.y2 < tarY + tarHeight) //point 2
      {
        linesfound.push({ele, point: 2})
      }
    }
  }
  return linesfound.length === 0 ? null : linesfound //return any lines found, if not null
}

function findAllEle(elements, selrect){ //find any elements
  const elefound = []
  var {x, y, height, width} = selrect

  if (height < 0){ //if width neg
    height = -(height)
    y = y - height
  }
  if (width < 0){ //if width neg
    width = -(width)
    x = x - width
  }

  for (const ele of elements){
    if (x < ele.x && ele.x < x + width && y < ele.y && ele.y < y + height && 
      x < ele.x2 && ele.x2 < x + width && y < ele.y2 && ele.y2 < y + height){
      elefound.push(ele)
    }
  }
  return elefound.length === 0 ? null : elefound
}

function sortArray(elements){ //makes it so lines an arrows are on top of rectangles and images
  return elements.sort((a) => {
    if (a.type === "rectangle" || a.type === 'image'|| a.type === "text"){ 
      return -1
    }
    // else if (a.type === 'text') {
    //   return 1
    // }
    else{
      return 0
    }
  })
}

//react compnents

function SelectedLine({element, handleMouseEnter, handleMouseLeave}){
  const sharedAttr = {r: 7, type: 'selectedcircle', onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave}
  return (
    <>
      <circle {...sharedAttr} point = {1} cx = {element.x} cy = {element.y}/>
      <circle {...sharedAttr} point = {2} cx = {element.x2} cy = {element.y2}/>
    </>
  )
}

function SelectedRect({element, mouseEnterCircle, handleMouseLeave}){
  const sharedAttr = {r: 7, type: 'selectedcircle', onMouseEnter: mouseEnterCircle, onMouseLeave: handleMouseLeave}
  var {height, width, x, y} = element
  if (height < 0){ //if width neg
    height = -(height)
    y = y - height
  }
  if (width < 0){ //if width neg
    width = -(width)
    x = x - width
  }

  return ( // goes clockwise starting from top left, for point 1 selected do different calc
    <> 
      {/* <rect type = 'selectedrectangle' x = {x} y = {y} width = {width} height = {height} fill="none" stroke="black" strokeWidth={2.5} strokeDasharray="15"/> */}
      <circle {...sharedAttr} point = {1} cx = {x} cy = {y}/>
      <circle {...sharedAttr} point = {2} cx = {x + width/2} cy = {y}/>
      <circle {...sharedAttr} point = {3} cx = {x + width} cy = {y}/>
      <circle {...sharedAttr} point = {4} cx = {x + width} cy = {y + height/2}/>
      <circle {...sharedAttr} point = {5} cx = {x + width} cy = {y + height}/>
      <circle {...sharedAttr} point = {6} cx = {x + width/2} cy = {y + height}/>
      <circle {...sharedAttr} point = {7} cx = {x} cy = {y + height}/>
      <circle {...sharedAttr} point = {8} cx = {x} cy = {y + height/2}/>
    </>
  )
}

function MultiSelectedRect({element}){
  var {height, width, x, y} = element
  if (height < 0){ //if width neg
    height = -(height)
    y = y - height
  }
  if (width < 0){ //if width neg
    width = -(width)
    x = x - width
  }

  return ( // goes clockwise starting from top left, for point 1 selected do different calc
    <rect type = 'selectedmultirectangle' x = {x} y = {y} width = {width} height = {height} fill="transparent" stroke="black" strokeWidth={2.5} strokeDasharray="15"/>
  )
}

function TextSvg({x, y, text, sharedAttr, id, touched}){
  const [rectbox, setrectbox] = useState({height: 0, width: 0})
  const textRef = useRef(null)

  useEffect(() => { //get text width height
    const bbox = textRef.current.getBBox()
    setrectbox(
      {height: bbox.height, width: bbox.width}
    )
  }, [text])

  return(
    <>
      {touched ? <rect type = 'backrectangle'
      fill={'rgb(205, 205, 205)'} x = {x - 50} y = {y - rectbox.height - 50} width = {rectbox.width + 100} height = {rectbox.height + 100}/> : null}
      <text ref = {textRef} className = 'prevent-select' fontFamily = "sans-serif" 
      fontSize = "24px" x = {x} y = {y} id = {id} type = 'text' {...sharedAttr}>{text}</text>
    </>
  )
}

function RectSvg({x, y, width, height, sharedAttr, id, touched, color}){ //the rectangle plot
  if (height < 0){ //if width neg
    height = -(height)
    y = y - height
  }
  if (width < 0){ //if width neg
    width = -(width)
    x = x - width
  }
  return(
    <>
      {touched ? <rect type = 'backrectangle'
      fill={'rgb(205, 205, 205)'} x = {x-50} y = {y - 50} width = {width + 100} height = {height + 100}/> : null}
      <rect {...sharedAttr} type = 'rectangle' id = {id}
      x = {x} y = {y} width = {width} height = {height} fill='none' stroke={color} strokeWidth={5}/>
    </>
  )
}

function ImageSvg({x, y, height, width, href, sharedAttr, id, touched, text}){ //linessss
  if (height < 0){ //if width neg
    height = -(height)
    y = y - height
  }
  if (width < 0){ //if width neg
    width = -(width)
    x = x - width
  }

  return (
    <>
      {touched ? <rect type = 'backrectangle'
      fill={'rgb(205, 205, 205)'} x = {x-50} y = {y - 50} width = {width + 100} height = {height + 100}/> : null}
      <image {...sharedAttr} type = 'image' className = 'image' id = {id}
      x = {x} y={y} width={width} height={height} href={href}/>
      <text type = "textImage" x = {x + width/2} y = {y + height + 25} className = 'prevent-select' fontFamily = "sans-serif" fontSize = "24px" dominantBaseline="middle" textAnchor="middle">{text}</text>
    </>
  )
}

function LineSvg({x1, y1, x2, y2, sharedAttr, id, color}){ //linessss
  return (
    <line {...sharedAttr} type = 'line' className = 'line' id = {id}
    x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={5}/>
  )
}

function ArrowSvg({x1, y1, x2, y2, sharedAttr, id, color}){ //arrow
  return (
    <>
      <marker
        id={"arrowmark" + id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerUnits="strokeWidth"
        markerWidth="12"
        markerHeight="6"
        orient="auto-start-reverse"> 
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke = {color}/>
      </marker>
      <line {...sharedAttr} type = 'arrow' className = 'arrow' id = {id}
      x1={x1} y1={y1} x2={x2} y2={y2} stroke= {color} strokeWidth={5} markerEnd = {'url(#arrowmark' + id + ')'}/>
    </>
  )
}

function ArrowTextSvg({x1, y1, x2, y2, sharedAttr, id, text, color}){ //arrow
  const [rectbox, setrectbox] = useState({height: 0, width: 0})
  const textRef = useRef(null)

  useEffect(() => { //get text width height
    const bbox = textRef.current.getBBox()
    setrectbox(
      {height: bbox.height + 20, width: bbox.width + 20}
    )
  }, [text])


  return (
    <>
      <marker
        id={"arrowmark" + id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerUnits="strokeWidth"
        markerWidth="12"
        markerHeight="6"
        orient="auto-start-reverse"> 
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke = {color}/>
      </marker>
      <line {...sharedAttr} type = 'arrowText' id = {id}
      x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={5} markerEnd = {'url(#arrowmark' + id + ')'}/>
      <rect type = "textbox" x ={x1 + (x2 - x1)/2 - rectbox.width/2} y={y1 + (y2 - y1)/2 - rectbox.height/2} height = {rectbox.height} width = {rectbox.width} strokeWidth = {5} stroke={color} fill='white'/>
      <text type = "textArrowBox" className = 'prevent-select' x= {x1 + (x2 - x1)/2} y={y1 + (y2 - y1)/2} ref = {textRef} fontFamily = "sans-serif" fontSize = "24px" dominantBaseline="middle" textAnchor="middle">{text}</text>
    </>
  )
}

function ArrowText2Svg({x1, y1, x2, y2, sharedAttr, id, text, color}){ //arrow
  const [rectbox, setrectbox] = useState({height: 0, width: 0})
  const textRef = useRef(null)

  useEffect(() => { //get text width height
    const bbox = textRef.current.getBBox()
    setrectbox(
      {height: bbox.height + 20, width: bbox.width + 20}
    )
  }, [text])


  return (
    <>
      <marker
        id={"arrowmark" + id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerUnits="strokeWidth"
        markerWidth="12"
        markerHeight="6"
        orient="auto-start-reverse"> 
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke = {color}/>
      </marker>
      <line {...sharedAttr} type = 'arrowText2' id = {id}
      x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={5} markerStart = {'url(#arrowmark' + id + ')'} markerEnd = {'url(#arrowmark' + id + ')'}/>
      <rect type = "textbox" x ={x1 + (x2 - x1)/2 - rectbox.width/2} y={y1 + (y2 - y1)/2 - rectbox.height/2} height = {rectbox.height} width = {rectbox.width} strokeWidth = {5} stroke={color} fill='white'/>
      <text type = "textArrowBox" className = 'prevent-select' x= {x1 + (x2 - x1)/2} y={y1 + (y2 - y1)/2} ref = {textRef} fontFamily = "sans-serif" fontSize = "24px" dominantBaseline="middle" textAnchor="middle">{text}</text>
    </>
  )
}

function App() {
  const [action, setaction] = useState(null) //what action we are doing
  const [moreactions, setmoreactions] = useState(null) //more actions (like key bind?)
  const [elements, setelements] = useState([]) //elements in the canvas
  const [selectedTool, setTool] = useState('line') //what tool we have
  const [panOffset, setpanOffset] = useState({x: 0, y: 0}) //panoffset
  const [startOffset, setstartOffset] = useState({x: 0, y: 0}) //used for anyoffsets?
  const [otheroffset, setotherOffset] = useState(null) //used for other offsets (moving multiple elements)
  const [selectedID, setselectedID] = useState(null) //selected element for transform
  const [cursortype, setcursor] = useState('default') //cursor images
  const [selpoint, setselpoint] = useState(0) //the selected point number
  const [canvassize, setcanvassize] = useState({width: 2000, height: 1000}) //canvas size
  const [scale, setscale] = useState(1) //scale svg
  //const [scaleoffset, setscaleoffset] = useState({x: 0, y: 0}) //for scale offsets
  const [touchedID, setTouchedID] = useState(null) //touched rectangle id
  const [touchedID2, setTouchedID2] = useState(null) //touched rectangle id
  const [ogelement, setogelement] = useState(null) //incase we need the element before we mutate it (lock scaling)
  const [currentcolor, setcolor] = useState('#000000')

  //const [scaleOffset, setscaleOffset] = useState({x: 0, y:0})
  const svgRef = useRef(null) //svg ref
  const textRef = useRef(null)

  useEffect(() => { //key references
    function handleKeyDown(e) {
      if (action !== 'writing' && action !== 'changingtext'){ //we not writing or changing text
        if (action === 'resizing' && e.key === 'z'){ //if action is resizing and we are holding shift
          setmoreactions('lockscale')
        }
        else if (e.key === 'a'){
          setscale(prev => (prev - .01))
        }
        else if (e.key === 's'){
          setscale(prev => (prev + .01))
        }
      }
    }
    function handleKeyUp(){
      setmoreactions(null)
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    //Don't forget to clean up
    return function cleanup() {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    }
  });

  useEffect(() => { //writing texts
    const textarea = textRef.current
    if (action === "writing"){
      setTimeout(() => { //set timeout so it happens always
        textarea.focus()
      }, 0)
    }
  }, [action, selectedID])

  //event fuctions

  function handleMouseDown(e){ //on mouse down, for drawing currently
    const {clientX, clientY} = getMousePanCoord(e)

    if (action === 'writing') return

    if (selectedTool === 'panning'){ //starting panning coords when click on
      setaction('panning')
      setstartOffset({x: clientX, y: clientY})
    }
    else if (selectedTool === 'deletion' && (e.target.nodeName !== 'svg' && e.target.className !== "CanvasDiv")){
      const {id, type} = e.target.attributes
      if (type.value === 'selectedcircle' || type.value === 'selectedrectangle' || type.value === 'textArrowBox' || type.value === 'textImage'){ //just so we dont uhh, touch the borders lol
        return
      }
      const temp = [...elements]
      for (var i in temp){
        if (i > parseInt(id.value)){ //anything above the deleteID
          temp[i].id = temp[i].id - 1 //move element down
        }
      }
      temp.splice(parseInt(id.value), 1) //deletes the id
      setelements(temp)
      setselectedID(null)
      setcursor('default')
    }
    else if (selectedTool === 'selection' && (e.target.nodeName !== 'svg' && e.target.className !== "CanvasDiv")){ //we are doing selection and not press on svg element
      const {type, point, id} = e.target.attributes
      if (type.value === 'selectedcircle'){ //selected a circle, so rezing
        setaction('resizing')
        setselpoint(parseInt(point.value)) //get the points since apparently, e.target a staic DOM??
        const {cx, cy} = e.target.attributes
        const offsetx = clientX - parseInt(cx.value) //how far our mouse is from the og point
        const offsety = clientY - parseInt(cy.value)
        setstartOffset({x: offsetx, y: offsety})
      }
      else if (type.value === 'textbox' || type.value === 'selectedrectangle' || type.value === 'textArrowBox' || type.value === 'textImage'){ //just so we dont uhh, touch the borders lol
        return
      }
      else if (type.value === 'selectedmultirectangle'){ //clicked inside the multiselected (it should be always ontop)
        const offsetx = clientX - ogelement.x //how far our mouse is from the og point
        const offsety = clientY - ogelement.y
        setstartOffset({x: offsetx, y: offsety})
        setaction('movingmulti')
        const elefound = findAllEle(elements, {x: ogelement.x, y: ogelement.y, width: ogelement.width, height: ogelement.height})
        if (elefound){
          const temp = {}
          for (const e of elefound){
            temp[e.id] = {x: clientX - e.x, y: clientY - e.y}
          }
          setotherOffset(temp)
        }
      }
      else{ //selected an actual shape, applies the selected id for resizing as well, also moving
        setaction('moving')
        setselectedID(parseInt(id.value)) //selected ID
        if (type.value === 'rectangle' || type.value === 'image' ||type.value === 'text'){
          const {x, y} = e.target.attributes
          const offsetx = clientX - parseInt(x.value) //how far our mouse is from the og point
          const offsety = clientY - parseInt(y.value)
          setstartOffset({x: offsetx, y: offsety})
          setogelement(elements[parseInt(id.value)]) //save this for rectangles in case of resizing

          const linelementsfound = findLineEle(elements, parseInt(x.value), parseInt(y.value), 
          elements[parseInt(id.value)].width,elements[parseInt(id.value)].height)

          if (linelementsfound){
            const temp = {}
            for (const e of linelementsfound){
              if (e.point === 1){ //1st point is attactched
                temp[e.ele.id] = {x: clientX - parseInt(e.ele.x), y: clientY - parseInt(e.ele.y), point: e.point, text: e.text}
              }
              else{ //2nd point attatched
                temp[e.ele.id] = {x: clientX - parseInt(e.ele.x2), y: clientY - parseInt(e.ele.y2), point: e.point, text: e.text}
              }
            }
            setotherOffset(temp)
          }
        }
        else{ //lines and arrows and arrowtext?
          const {x1, y1} = e.target.attributes
          const offsetx = clientX - parseInt(x1.value) //how far our mouse is from the og point
          const offsety = clientY - parseInt(y1.value)
          setstartOffset({x: offsetx, y: offsety})
        }
      }
    }
    else if (selectedTool === 'selection' && (e.target.nodeName === 'svg' || e.target.className === "CanvasDiv")){ //we are selection or its a svg element or canvas div (grey box), multselect
      setogelement({x: clientX, y: clientY, width: 0, height: 0})
      setaction('multiselect')
      setselectedID(null)
    }
    else{ //we are drawing shapes, selection is the type
      const id = elements.length
      const ele = createElement(selectedTool , clientX, clientY, clientX, clientY, id, null, "", currentcolor) //set out element permenatly
      setelements(prev => [...prev, ele])
      setselectedID(id)
      setaction(selectedTool === 'text' ? 'writing' : 'drawing') //if text, then just writing
    }
  }

  function handleMouseMove(e){ //moving mouse
    const {clientX, clientY} = getMousePanCoord(e) //where our mouse is now

    //if (action === null) return //if no action?

    if (action === 'drawing'){ //drawing it
      const id = elements.length - 1
      const {type, x, y, color} = elements[id] //get previous coordinate on mousedown
      updateElement(type, x, y, clientX, clientY, id, null, '', color) //dragable element, not perm yet
      if (type === 'arrow' || type === 'line' || type === 'arrowText' || type === 'arrowText2'){
        const elementfound = findRectangleEle(elements, x, y, clientX, clientY) //find rectangles we connected to
        if (elementfound){
          //const {ele} = elementfound
          setTouchedID(elementfound[0].id)
          if (elementfound[1]) setTouchedID2(elementfound[1].id)
        }
        else{
          setTouchedID(null)
          setTouchedID2(null)
        }
      }
    }
    else if (action === 'panning'){
      const deltaX = clientX - startOffset.x;
      const deltaY = clientY - startOffset.y;
      setpanOffset({
        x: panOffset.x + (deltaX),
        y: panOffset.y + (deltaY),
      })
    }
    else if(action === 'movingmulti'){
      const temp = []
      setogelement(prev => {return {...prev, x: clientX - startOffset.x, y: clientY - startOffset.y}})
      for (const ele in otheroffset){ //in only works for dicts
        const newlineX = clientX - otheroffset[ele].x //this is for all shapes
        const newlineY = clientY - otheroffset[ele].y
        temp.push({type: elements[ele].type, x: newlineX, y: newlineY, 
        x2: newlineX + elements[ele].width , y2: newlineY + elements[ele].height, id: ele, 
        text: elements[ele].text, file: elements[ele].file, color: elements[ele].color})
      }
      updateMultipleElements(temp)
    }
    else if(action === 'moving'){
      const {width, height, type, id, file, text, color} = elements[selectedID] //selected shape
      const newX = clientX - startOffset.x //new x is new x coord of selected object
      const newY = clientY - startOffset.y //new y is new y coord of selected object

      if (type === 'arrow' || type === 'line' || type === 'arrowText' || type === 'arrowText2'){
        updateElement(type, newX, newY, newX + width, newY + height, id, null, text, color) //make it drag
        //k we are moving lines, check if the points touch any rectangles
        const elementfound = findRectangleEle(elements, newX, newY, newX + width, newY + height) //find rectangles we connected to
        if (elementfound){
          setTouchedID(elementfound[0].id)
          if (elementfound[1]) setTouchedID2(elementfound[1].id)
        }
        else{
          setTouchedID(null)
          setTouchedID2(null)
        }
      }
      else if (type === 'rectangle' || type === 'image' || type === 'text'){
        setTouchedID(selectedID)
        if (otheroffset){ //move any line, change to single point
          const temp = []
          temp.push({type, x: newX, y: newY, x2: newX + width, y2: newY + height, id, file: file, text: text, color: color})
          for (const ele in otheroffset){ //in only works for dicts
            const newlineX = clientX - otheroffset[ele].x //also these are lines and arrows and all
            const newlineY = clientY - otheroffset[ele].y
            if (otheroffset[ele].point === 1){
              temp.push({type: elements[ele].type, x: newlineX, y: newlineY, 
              x2: elements[ele].x2, y2: elements[ele].y2, id: ele, text: elements[ele].text, color: elements[ele].color})
            }
            else{ //point 2
              temp.push({type: elements[ele].type, x: elements[ele].x, y: elements[ele].y, 
              x2: newlineX , y2: newlineY, id: ele, text: elements[ele].text, color: elements[ele].color})
            }
          }
          updateMultipleElements(temp)
        }
        else{ //single rectangle not connected to anything
          updateElement(type, newX, newY, newX + width, newY + height, id, file, text, color)
        }
      }
    }
    else if(action === 'multiselect'){ //resizing multiselect rect
      setogelement(prev => {return {...prev, width: clientX - ogelement.x, height: clientY - ogelement.y}})
    }
    else if(action === 'resizing'){
      const {x, y, x2, y2, type, id, file, text, color} = elements[selectedID]
      var newX, newY
      if (moreactions === 'lockscale'){ //locks scaling from og selected point, calculate y from point and equal x from that, we dont need offset
        if (selpoint === 1){
          newY = clientY
          newX = ogelement.x - (ogelement.y - clientY)
        }
        else if (selpoint === 3){
          newY = clientY
          newX = ogelement.x + ogelement.width + (ogelement.y - clientY)
        }
        else if (selpoint === 5){
          newY = clientY
          newX = ogelement.x + ogelement.width + (clientY - (ogelement.y + ogelement.height))
        }
        else if (selpoint === 7){
          newY = clientY
          newX = ogelement.x - (clientY - (ogelement.y + ogelement.height))
        }
        else{
          newX = clientX - startOffset.x
          newY = clientY - startOffset.y
        }
      }
      else{
        newX = clientX - startOffset.x
        newY = clientY - startOffset.y
      }

      if (type === 'rectangle' || type === 'image'){
        setTouchedID(selectedID)
        if(selpoint === 1){ //top left
          updateElement(type, newX, newY, x2, y2, id, file, text, color)
        }
        else if(selpoint === 2){ 
          updateElement(type, x, newY, x2, y2, id, file, text, color)
        }
        else if(selpoint === 3){
          updateElement(type, x, newY, newX, y2, id, file, text, color)
        }
        else if(selpoint === 4){ 
          updateElement(type, x, y, newX, y2, id, file, text, color)
        }
        else if(selpoint === 5){
          updateElement(type, x, y, newX, newY, id, file, text, color)
        }
        else if(selpoint === 6){
          updateElement(type, x, y, x2, newY, id, file, text, color)
        }
        else if(selpoint === 7){
          updateElement(type, newX, y, x2, newY, id, file, text, color)
        }
        else{ //point 8
          updateElement(type, newX, y, x2, y2, id, file, text, color)
        }
      } 
      else if (type === 'arrow' || type === 'line' || type === "arrowText" || type === 'arrowText2'){
        if (selpoint === 1){ //1st point is the dragged circle
          updateElement(type, newX, newY, x2, y2, id, null, text, color)

          const elementfound = findRectangleEle(elements, newX, newY, x2, y2) //find rectangles we connected to
          if (elementfound){
            setTouchedID(elementfound[0].id)
            if (elementfound[1]) setTouchedID2(elementfound[1].id)
          }
          else{
            setTouchedID(null)
            setTouchedID2(null)
          }
        }
        else{ //2nd point
          updateElement(type, x, y, newX, newY, id, null, text, color)

          const elementfound = findRectangleEle(elements, x, y, newX, newY) //find rectangles we connected to
          if (elementfound){
            setTouchedID(elementfound[0].id)
            if (elementfound[1]) setTouchedID2(elementfound[1].id)
          }
          else{
            setTouchedID(null)
            setTouchedID2(null)
          }
        }
      }
    }
  }

  function handleMouseUp(){ //when mouse is lifted

    if (action === 'drawing'){ //reorienting the drawn rectangles to the topleft corner
      const id = elements.length - 1
      var {type, x, y, width, height, color} = elements[id] //get previous coordinate on mousedown
      if (type === 'rectangle') { //only for rectangles
        if (height < 0){ //if width neg
          height = -(height)
          y = y - height
        }
        if (width < 0){ //if width neg
          width = -(width)
          x = x - width
        }
        updateElement(type, x, y, x + width, y + height, id, null, '', color) //dragable element, not perm yet
      }
    }
    else if(action === "multiselect"){
      const elefound = findAllEle(elements, {x: ogelement.x, y: ogelement.y, width: ogelement.width, height: ogelement.height})
      if (elefound) setmoreactions('movemultiselect')
      else setmoreactions(null)
    }
    else if (action === 'writing') return //if writing or multiselect
    else if (action === 'resizing') setogelement(elements[selectedID]) //save the og position when we resize again later

    setotherOffset(null)
    setTouchedID(null)
    setTouchedID2(null)
    setaction(null)
  }

  function handleDrop(e){ //handling drop events (images)
    e.preventDefault() //skips the image opening on new tab
    const file = e.dataTransfer.files[0] //gets file dragged in (this specific path only, global dont have it...)
    if (file.type !== "image/png"){
      alert("That is not an image/png file")
      return
    }

    const {clientX, clientY} = getMousePanCoord(e)
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const id = elements.length
        const ele = createElement("image", clientX, clientY, clientX + width, clientY + height, id, reader.result, "")
        setelements(prev => [...prev, ele])
      };

      img.src = reader.result; //readfile
    }
    reader.readAsDataURL(file); //readingg
  }

  function handleMouseEnter(){
    if (selectedTool === 'selection' && action !== 'resizing'){
      setcursor('move')
    }
    else if (selectedTool === 'deletion'){
      setcursor('not-allowed')
    }
  }

  function handleMouseLeave(){
    setcursor('default')
  }

  function mouseEnterCircle(e){
    const point = parseInt(e.target.attributes.point.value)
    if(point === 1 || point === 5){
      setcursor('nwse-resize')
    }
    else if (point === 2 || point === 6){
      setcursor('ns-resize')
    }
    else if (point === 3 || point === 7){
      setcursor('nesw-resize')
    }
    else{ //point 4 and 8
      setcursor('ew-resize')
    }
  }

  //other functions

  function updateElement(type, x, y, x2, y2, id, file, text, color){ //update element on drag
    const upelement = createElement(type, x, y, x2, y2, id, file, text, color) //dragable element, not perm yet
    const elementcopy = [...elements]
    elementcopy[id] = upelement
    setelements(elementcopy)
  }

  function updateMultipleElements(updatedelements){
    const elementcopy = [...elements]
    for (const ele of updatedelements){
      const upelement = createElement(ele.type, ele.x, ele.y, ele.x2, ele.y2, ele.id, ele.file, ele.text, ele.color)
      elementcopy[ele.id] = upelement
    }
    setelements(elementcopy)
  }

  function getMousePanCoord(evt){ //modify mouse coordinates so we draw correctly
    // const clientX = (evt.clientX - panOffset.x * scale + scaleoffset.x) / scale
    // const clientY = (evt.clientY - panOffset.y * scale + scaleoffset.y) / scale
    const clientX = (evt.clientX - panOffset.x * scale) / scale
    const clientY = (evt.clientY - panOffset.y * scale) / scale
    return { clientX, clientY };
  }

  function clearboard(){ //clears board
    setelements([])
  }

  function undoboard(){ //undo element
    const tempcopy = [...elements]
    setelements(tempcopy.slice(0, -1))
  }

  function handleBlur(event){ //when we click out of the text input for when writing text (dif from changing text)
    const { id, x, y, type } = elements[selectedID];
    setselectedID(null);
    setaction(null)
    if (event.target.value === ""){ //if empty string, pls delete from array
      setelements((previousArr) => (previousArr.slice(0, -1)));
    }
    else{
      const {width, height} = getTextDimensions(event.target.value, "sans-serif", 24)
      updateElement(type, x, y, x+width, y+height, id, null, event.target.value);
    }
  }

  function handleTextChange(newtext){ //when we change the text in the text input, if type is text then chnage the width and height
    const temp = [...elements]
    if (temp[selectedID].type === "text"){
      const {width, height} = getTextDimensions(newtext, "sans-serif", 24)
      temp[selectedID].width = width
      temp[selectedID].height = height
    }
    temp[selectedID].text = newtext
    setelements(temp)
  }

  function convertsvg(){
    setselectedID(null)
    const svgString = new XMLSerializer().serializeToString(svgRef.current); //make html to string
    const temp = svgString.split('translate(')
    const temp2 = svgString.split('); ')
    const NewsvgString = (temp[0] + 'translate(0px,0px) scale(1); ' + temp2[1]) //manipulate string so translate is back to 0 and scale to 1 but not shift current image
    //console.log(NewsvgString)

    const svgBlob = new Blob([NewsvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    console.log(url)

    const img = new Image();
    img.onload = () => { //on image load
      const canvas = document.createElement('canvas');
      canvas.width = canvassize.width;
      canvas.height = canvassize.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0)

      // Now you can use canvas.toDataURL() to get the image data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      // You can use imageDataUrl as the src of an img tag, or save it as an image file

      var download = function(href, name){ //download thing
        var link = document.createElement('a');
        link.download = name;
        link.style.opacity = "0";
        link.href = href;
        link.click();
        link.remove();
      }
      download(imageDataUrl, "image.png");

      // If you want to display the image on the page, you can set the src of an img element
    };
    img.src = url
  }

  function onZoom(addedscale){
    const newscale = scale + addedscale
    //const {scaleOffsetX, scaleOffsetY} = calcScaleOffset(canvassize, newscale)
    //setscaleoffset({x: scaleOffsetX, y: scaleOffsetY})
    setscale(newscale)
  }

  function exportFile(){
    const svgBlob = new Blob([JSON.stringify(elements)], { type: 'application/json' });
    const url = URL.createObjectURL(svgBlob) //make it a url

    var link = document.createElement('a');
    link.download = 'canvas.json';
    link.style.opacity = "0";
    link.href = url;
    link.click();
    link.remove();
  }

  function importFile(evt){
    const file = evt.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const contents = JSON.parse(event.target.result);
        // Process the file contents here
        setelements(contents)

        //auto canvas size, find based on max x and y as well as adding the height and width
        let maxwidth = 950
        let maxheight = 1950
        for (var i of contents){ //array
          if (i.x + i.width > maxwidth) maxwidth = i.x + i.width
          if (i.y + i.height > maxheight) maxheight = i.y + i.height
        }

        setcanvassize({width: Math.round(maxwidth + 50), height: Math.round(maxheight + 50)})

    };

    reader.readAsText(file);
  }

  // function calcScaleOffset(canvas, newscale){
  //   const scaledWidth = canvas.width * newscale
  //   const scaledHeight = canvas.height * newscale
  //   const scaleOffsetX = (scaledWidth - canvas.width) / 2
  //   const scaleOffsetY = (scaledHeight - canvas.height) / 2
  //   return {scaleOffsetX, scaleOffsetY}
  // }

  //below runs every render

  const sharedAttr =  {onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave}

  const svgelements = sortArray([...elements]).map((i, index) => { //render elements
    if (i.type === "rectangle"){
      return (
        <RectSvg sharedAttr = {sharedAttr} id = {i.id} touched = {touchedID === i.id || touchedID2 === i.id ? true : false}
        key = {index} x={i.x} y={i.y} width={i.width} height={i.height} color = {i.color}/>
      )
    }
    else if(i.type === "arrow"){
      return (
        <ArrowSvg sharedAttr = {sharedAttr} id = {i.id}
        key = {index} x1={i.x} y1={i.y} x2={i.x2} y2={i.y2} color = {i.color}/>
      )
    }
    else if(i.type === "arrowText"){
      return (
        <ArrowTextSvg sharedAttr = {sharedAttr} id = {i.id} 
        key = {index} x1={i.x} y1={i.y} x2={i.x2} y2={i.y2} text = {i.text} color = {i.color}/>
      )
    }
    else if(i.type === "arrowText2"){
      return (
        <ArrowText2Svg sharedAttr = {sharedAttr} id = {i.id}
        key = {index} x1={i.x} y1={i.y} x2={i.x2} y2={i.y2} text = {i.text} color = {i.color}/>
      )
    }
    else if(i.type === "line"){
      return (
        <LineSvg sharedAttr = {sharedAttr} id = {i.id}
        key = {index} x1={i.x} y1={i.y} x2={i.x2} y2={i.y2} color = {i.color}/>
      )
    }
    else if (i.type === "image"){
      return (
        <ImageSvg sharedAttr = {sharedAttr} id = {i.id} touched = {touchedID === i.id || touchedID2 === i.id ? true : false}
        key = {index} x = {i.x} y={i.y} width={i.width} height={i.height} href={i.file} text = {i.text}/>
      )
    }
    else if (i.type === "text"){
      return (
        <TextSvg sharedAttr = {sharedAttr} id = {i.id} touched = {touchedID === i.id || touchedID2 === i.id ? true : false}
        key = {index} x = {i.x} y={i.y} text={i.text}/>
      )
    }
    else{ //not any type ????
      return null
    }
  })

  if (selectedID !== null && (selectedTool === 'selection' && action !== 'moving')){ //we are just, gonna turn off the transform if we move because i don't wanna move the transdoem
    if (elements[selectedID].type === 'rectangle' || elements[selectedID].type === 'image'){
      svgelements.push(
        <SelectedRect key = {-4} element = {elements[selectedID]}
        handleMouseLeave={handleMouseLeave} mouseEnterCircle = {mouseEnterCircle}/>
      )
    }
    else if (elements[selectedID].type === 'text'){
      ///????
    }
    else{ //line or arrow
      svgelements.push(
        <SelectedLine key = {-1} element = {elements[selectedID]} 
        handleMouseLeave={handleMouseLeave} handleMouseEnter = {handleMouseEnter}/>
      )
    }
  }

  if (action === 'multiselect' || moreactions === "movemultiselect"){
    svgelements.push(<MultiSelectedRect key = {-20} element={{x: ogelement.x, y: ogelement.y, width: ogelement.width, height: ogelement.height}}/>)
  }

  //svgelements.push(<circle key = {1000} cx = {400} cy = {400} r = {10}/>)

  return (
    <div className="HomePage" >
      <div className="SideBar">
        <input type="radio" id="Bline" name='selecttool' onChange={() => {setTool('line'); setselectedID(null)}} defaultChecked={'checked'}/>
        <label htmlFor="Bline">Line</label>
        <br/>
        <input type="radio" id="Barrow" name='selecttool' onChange={() => {setTool('arrow'); setselectedID(null)}}/>
        <label htmlFor="Barrow">Arrow</label>
        <br/>
        <input type="radio" id="BarrowText" name='selecttool' onChange={() => {setTool('arrowText'); setselectedID(null)}}/>
        <label htmlFor="BarrowText">Arrow w/ Text</label>
        <br/>
        <input type="radio" id="BarrowText2" name='selecttool' onChange={() => {setTool('arrowText2'); setselectedID(null)}}/>
        <label htmlFor="BarrowText2">2Arrow w/ Text</label>
        <br/>
        <input type="radio" id="Brectangle" name='selecttool' onChange={() => {setTool('rectangle'); setselectedID(null)}}/>
        <label htmlFor="Brectangle">Rectangle</label>
        <br/>
        <input type="radio" id="Btext" name='selecttool' onChange={() => {setTool('text'); setselectedID(null)}}/>
        <label htmlFor="Btext">Text</label> 
        <br/>
        <input type="radio" id="Bselection" name='selecttool' onChange={() => setTool('selection')}/>
        <label htmlFor="Bselection">Selection</label>
        <br/>
        <input type="radio" id="Bdeletion" name='selecttool' onChange={() => {setTool('deletion'); setselectedID(null)}}/>
        <label htmlFor="Bdeletion">Deletion</label>
        <br/>
        <input type="radio" id="Bpanning" name='selecttool' onChange={() => {setTool('panning'); setselectedID(null)}}/>
        <label htmlFor="Bpanning">Panning</label>
        <br/>
        <button onClick={() => {clearboard(); setselectedID(null)}}>Clear Board</button>
        <br/>
        <button onClick={() => {undoboard(); setselectedID(null)}}>Undo Element</button>
        <br/>
        <button onClick={() => {convertsvg(); setselectedID(null)}}>Convert to Image</button>
        <br/>
        <label>Width:</label>
        <input type='number' style = {{width: 100}} value = {canvassize.width} 
        onChange={e => {
          //const {scaleOffsetX, scaleOffsetY} = calcScaleOffset({height: canvassize.height, width: e.target.value}, scale)
          setcanvassize({height: canvassize.height, width: e.target.valueAsNumber})
          //setscaleoffset({x: scaleOffsetX, y: scaleOffsetY})
          //setpanOffset({x: (scaleOffsetX/scale), y: (scaleOffsetY/scale)})
          }}/>
        <br/>
        <label>Height:</label>
        <input type='number' style = {{width: 100}} value = {canvassize.height} 
        onChange={e => {
          //const {scaleOffsetX, scaleOffsetY} = calcScaleOffset({width: canvassize.width, height: e.target.value}, scale)
          setcanvassize({width: canvassize.width , height: e.target.valueAsNumber}) 
          //setscaleoffset({x: scaleOffsetX, y: scaleOffsetY})
          //setpanOffset({x: (scaleOffsetX/scale), y:(scaleOffsetY/scale)}) //reset coords
          }}/>
        <CompactPicker color = {currentcolor} onChange={e => {
          if (selectedTool === "selection" && selectedID != null){ //change color of selected line
            const {type, x, y, x2, y2, id, file, text} = elements[selectedID]
            updateElement(type, x, y, x2, y2, id, file, text, e.hex)
          }
          setcolor(e.hex)
          }}/>
        <label>Zoom:</label>
        <br/>
        <button onClick={() => {onZoom(-0.1); setselectedID(null)}}>-</button>
        <span>{new Intl.NumberFormat('en-GB', {style: "percent"}).format(scale)}</span>
        <button onClick={() => {onZoom(+0.1); setselectedID(null)}}>+</button>
        <br/>
        <input type="file" accept="application/json" onChange={importFile}/>
        <br/>
        <button onClick={() => {exportFile(); setselectedID(null)}}>Export Elements</button>
        <br/>
        <p>Drag an image to the Canvas to place it</p>
        <p>Hold Z to lock scale when resizing</p>
        <p>Use A and S to scale the canvas</p>
        {selectedID !== null && (elements[selectedID].type === 'text' || elements[selectedID].type === 'arrowText' || elements[selectedID].type === 'arrowText2' || elements[selectedID].type === 'image') && selectedTool === 'selection' 
        ? <textarea value = {elements[selectedID].text} onBlur = {() => setaction(null)} onFocus = {() => setaction('changingtext')} onChange = {(e) => handleTextChange(e.target.value)} 
        style = {{width: 200}}></textarea> : null}
      </div>
      <div className="CanvasDiv" 
      style={{cursor: cursortype}}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}>
        <svg 
          ref = {svgRef}
          style = {{
            transform: "translate(" + (panOffset.x * scale) + "px," + (panOffset.y * scale) + "px) scale(" + scale + ")",
            transformOrigin: '0 0'}}
          width={canvassize.width}
          height={canvassize.height}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          id = 'svgcontainer'
          //style = {{'transform-origin': '0 0' , transform: "translate(" + (panOffset.x * scale - scaleoffset.x) + "px," + (panOffset.y * scale - scaleoffset.y) + "px) scale(" + scale + ")"}}
          >
          {svgelements}
        </svg>
        {action === 'writing' ? <textarea
            ref = {textRef}
            onBlur={handleBlur}
            style={{
              position: "absolute",
              top: (elements[selectedID].y - 22 )* scale + panOffset.y * scale,
              left: elements[selectedID].x * scale + panOffset.x * scale,
              font: (24 * scale) + "px sans-serif",
              margin: 0,
              padding: 0,
              border: 0,
              outline: 0,
              //resize: "auto",
              overflow: "hidden",
              whiteSpace: "pre",
              background: "transparent",
              zIndex: 2,
            }}
          /> : null}
      </div>
    </div>
  )
}

export default App;
