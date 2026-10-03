import AppKit
let destination = CommandLine.arguments[1]
try FileManager.default.createDirectory(atPath: destination, withIntermediateDirectories: true)
for size in [16, 32, 64, 128, 256, 512, 1024] {
 let image = NSImage(size: NSSize(width: size, height: size))
 image.lockFocus()
 let n = CGFloat(size)
 let rect = NSRect(x:n*0.06,y:n*0.06,width:n*0.88,height:n*0.88)
 let shape = NSBezierPath(roundedRect: rect,xRadius:n*0.20,yRadius:n*0.20)
 let gradient = NSGradient(starting:NSColor(calibratedRed:0.22,green:0.42,blue:0.98,alpha:1),ending:NSColor(calibratedRed:0.34,green:0.20,blue:0.84,alpha:1))!
 gradient.draw(in:shape,angle:-70)
 NSColor.white.withAlphaComponent(0.95).setStroke()
 let box = NSBezierPath(roundedRect:NSRect(x:n*0.27,y:n*0.27,width:n*0.46,height:n*0.46),xRadius:n*0.06,yRadius:n*0.06)
 box.lineWidth = n*0.026;box.stroke()
 let lines=NSBezierPath();lines.lineWidth=n*0.025
 lines.move(to:NSPoint(x:n*0.5,y:n*0.28));lines.line(to:NSPoint(x:n*0.5,y:n*0.72))
 lines.move(to:NSPoint(x:n*0.28,y:n*0.5));lines.line(to:NSPoint(x:n*0.72,y:n*0.5));lines.stroke()
 image.unlockFocus()
 let representation=NSBitmapImageRep(data:image.tiffRepresentation!)!
 let png=representation.representation(using:.png,properties:[:])!
 try png.write(to:URL(fileURLWithPath:destination+"/size_\(size).png"))
}
