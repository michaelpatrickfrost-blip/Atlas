import AppKit

let destination = CommandLine.arguments[1]
let masterPath = "desktop/macos/icon/atlas-icon-1024.png"
guard let master = NSImage(contentsOfFile: masterPath) else {
  fputs("Missing \(masterPath)\n", stderr)
  exit(1)
}
try FileManager.default.createDirectory(atPath: destination, withIntermediateDirectories: true)
for size in [16, 32, 64, 128, 256, 512, 1024] {
  let image = NSImage(size: NSSize(width: size, height: size))
  image.lockFocus()
  master.draw(in: NSRect(x: 0, y: 0, width: CGFloat(size), height: CGFloat(size)), from: .zero, operation: .copy, fraction: 1)
  image.unlockFocus()
  let representation = NSBitmapImageRep(data: image.tiffRepresentation!)!
  let png = representation.representation(using: .png, properties: [:])!
  try png.write(to: URL(fileURLWithPath: destination + "/size_\(size).png"))
}
