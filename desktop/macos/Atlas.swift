import AppKit
import WebKit
import UniformTypeIdentifiers

// Page reload is not offered. It tears down the desktop workspace. Records save to the server as they are entered, and the open page keeps reading them back.
final class AtlasWebView: WKWebView {
    override func reload() -> WKNavigation? { nil }
    override func reloadFromOrigin() -> WKNavigation? { nil }
}

// A second workspace window. It shares the Mac app's session store so another module can sit on another screen.
final class WorkspaceWindow: NSObject, NSWindowDelegate {
    let window: NSWindow
    let web: WKWebView
    var onClose: ((WorkspaceWindow) -> Void)?
    init(web: WKWebView, near frame: NSRect?) {
        self.web = web
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1280, height: 840), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        super.init()
        window.delegate = self
        window.title = "Atlas"
        window.subtitle = "Desktop software · server data"
        window.minSize = NSSize(width: 430, height: 600)
        window.isReleasedWhenClosed = false
        let root = NSView()
        window.contentView = root
        web.translatesAutoresizingMaskIntoConstraints = false
        root.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: root.topAnchor),
            web.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: root.trailingAnchor),
        ])
        if let frame {
            window.setFrameOrigin(NSPoint(x: frame.origin.x + 36, y: max(40, frame.origin.y - 36)))
        } else {
            window.center()
        }
    }
    func windowWillClose(_ notification: Notification) { onClose?(self) }
    func show() { window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true) }
}

// Atlas UI/runtime runs from this Mac app bundle. Business records stay on the data service.
final class AtlasApp: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    var window: NSWindow!
    var web: AtlasWebView!
    var status: NSTextField!
    var tunnel: Process?
    var runtime: Process?
    var errorPanel: NSStackView!
    var workspaces: [WorkspaceWindow] = []
    var timer: Timer?
    var generation = 0
    var workspaceReady = false
    var lastTunnelAttempt = Date.distantPast
    var lastRuntimeAttempt = Date.distantPast
    let logQueue = DispatchQueue(label: "atlas.launcher.log")
    var logHandle: FileHandle?
    let dataURL = URL(string: "http://127.0.0.1:13100")!
    let localURL = URL(string: "http://127.0.0.1:13200")!
    var serverURL: URL { localURL }
    var dataServiceURL: URL { URL(string: UserDefaults.standard.string(forKey: "dataServiceURL") ?? dataURL.absoluteString) ?? dataURL }

    func applicationDidFinishLaunching(_ notification: Notification) {
        makeMenu()
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent() // No persistent business-data cache on this Mac.
        web = AtlasWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0,y: 0,width: 1360,height: 880), styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = "Atlas"
        window.subtitle = "Starting on this Mac…"
        window.minSize = NSSize(width: 430,height: 600)
        window.center()
        if let iconURL = Bundle.main.url(forResource: "Atlas", withExtension: "icns") {
            NSApp.applicationIconImage = NSImage(contentsOf: iconURL)
        }
        let root = NSView()
        window.contentView = root
        status = NSTextField(labelWithString: "Starting Atlas on this Mac…")
        web.translatesAutoresizingMaskIntoConstraints = false
        root.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: root.topAnchor),
            web.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: root.trailingAnchor),
        ])
        errorPanel = NSStackView(); errorPanel.orientation = .vertical; errorPanel.spacing = 16; errorPanel.alignment = .centerX
        errorPanel.wantsLayer = true; errorPanel.layer?.backgroundColor = NSColor.windowBackgroundColor.cgColor; errorPanel.layer?.cornerRadius = 20
        errorPanel.edgeInsets = NSEdgeInsets(top:32,left:32,bottom:32,right:32)
        let heading=NSTextField(labelWithString:"Connecting to your workspace")
        heading.font = .systemFont(ofSize:24,weight:.semibold)
        let body=NSTextField(wrappingLabelWithString:"Atlas is starting on this Mac and connecting to the server. Your records stay on the server. This app does not start a local database. It will keep trying until the workspace opens.")
        body.alignment = .center; body.preferredMaxLayoutWidth=360
        errorPanel.addArrangedSubview(heading); errorPanel.addArrangedSubview(body)
        errorPanel.addArrangedSubview(NSButton(title:"Reconnect",target:self,action:#selector(forceReconnect)))
        errorPanel.translatesAutoresizingMaskIntoConstraints=false; root.addSubview(errorPanel)
        NSLayoutConstraint.activate([errorPanel.centerXAnchor.constraint(equalTo:root.centerXAnchor),errorPanel.centerYAnchor.constraint(equalTo:root.centerYAnchor),errorPanel.widthAnchor.constraint(lessThanOrEqualTo:root.widthAnchor,multiplier:0.9)])
        errorPanel.isHidden=true
        window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps:true)
        reconnect()
    }
    func makeMenu() {
        let menu=NSMenu(); let appItem=NSMenuItem(); let appMenu=NSMenu()
        appMenu.addItem(withTitle:"Connection…",action:#selector(connection),keyEquivalent:",").target=self
        appMenu.addItem(.separator()); appMenu.addItem(withTitle:"Quit Atlas",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q")
        appItem.submenu=appMenu; menu.addItem(appItem)
        let editItem=NSMenuItem(); let edit=NSMenu(title:"Edit")
        for (name,action,key) in [("Undo",Selector(("undo:")),"z"),("Cut",#selector(NSText.cut(_:)),"x"),("Copy",#selector(NSText.copy(_:)),"c"),("Paste",#selector(NSText.paste(_:)),"v"),("Select All",#selector(NSText.selectAll(_:)),"a")] { edit.addItem(withTitle:name,action:action,keyEquivalent:key) }
        editItem.submenu=edit;menu.addItem(editItem)
        let viewItem=NSMenuItem();let view=NSMenu(title:"View")
        view.addItem(withTitle:"New Window",action:#selector(newWindow),keyEquivalent:"n").target=self
        view.addItem(withTitle:"Back",action:#selector(back),keyEquivalent:"[").target=self
        viewItem.submenu=view;menu.addItem(viewItem);NSApp.mainMenu=menu
    }
    @objc func back() {web.goBack()}
    @objc func newWindow() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = web.configuration.websiteDataStore
        let popup = presentWorkspace(configuration: config)
        popup.load(URLRequest(url: web.url ?? serverURL.appendingPathComponent("home")))
    }
    func presentWorkspace(configuration: WKWebViewConfiguration) -> WKWebView {
        let popup = AtlasWebView(frame: .zero, configuration: configuration)
        popup.navigationDelegate = self
        popup.uiDelegate = self
        let workspace = WorkspaceWindow(web: popup, near: window.frame)
        workspace.onClose = { [weak self] closed in self?.workspaces.removeAll { $0 === closed } }
        workspaces.append(workspace)
        workspace.show()
        return popup
    }
    func hostWindow(for webView: WKWebView) -> NSWindow {
        workspaces.first { $0.web === webView }?.window ?? window
    }
    func appendLog(_ message: String) {
        let line = ISO8601DateFormatter().string(from: Date()) + " " + message + "\n"
        logQueue.async {
            if self.logHandle == nil {
                let dir = URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Library/Logs/Atlas")
                try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                let url = dir.appendingPathComponent("launcher.log")
                if !FileManager.default.fileExists(atPath: url.path) { FileManager.default.createFile(atPath: url.path, contents: nil) }
                self.logHandle = try? FileHandle(forWritingTo: url)
                self.logHandle?.seekToEndOfFile()
            }
            guard let data = line.data(using: .utf8) else { return }
            self.logHandle?.write(data)
            FileHandle.standardError.write(data)
        }
    }
    func bindOutput(_ process: Process, name: String) {
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            guard !data.isEmpty, let text = String(data: data, encoding: .utf8) else { return }
            self?.appendLog(name + ": " + text.trimmingCharacters(in: .whitespacesAndNewlines))
        }
    }
    func portOpen(_ port: Int) -> Bool {
        let probe = Process()
        probe.executableURL = URL(fileURLWithPath: "/usr/bin/nc")
        probe.arguments = ["-z", "-G", "1", "127.0.0.1", String(port)]
        probe.standardOutput = FileHandle.nullDevice
        probe.standardError = FileHandle.nullDevice
        do { try probe.run(); probe.waitUntilExit(); return probe.terminationStatus == 0 } catch { return false }
    }
    func ensureTunnel() {
        guard dataServiceURL == dataURL, tunnel?.isRunning != true else { return }
        if portOpen(13100) { return }
        if Date().timeIntervalSince(lastTunnelAttempt) < 5 { return }
        lastTunnelAttempt = Date()
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/usr/bin/ssh")
        p.arguments = ["-i", NSHomeDirectory()+"/.ssh/atlas_test_ed25519", "-N", "-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=10", "-o", "ExitOnForwardFailure=yes", "-o", "ServerAliveInterval=20", "-o", "ServerAliveCountMax=3", "-L", "127.0.0.1:13100:127.0.0.1:3100", "atlas-connect@217.154.51.15"]
        bindOutput(p, name: "tunnel")
        do { try p.run(); tunnel = p; appendLog("tunnel started") } catch { appendLog("tunnel failed to start: \(error.localizedDescription)") }
    }
    func ensureRuntime() {
        if runtime?.isRunning == true { return }
        if portOpen(13200) { return }
        if Date().timeIntervalSince(lastRuntimeAttempt) < 3 { return }
        lastRuntimeAttempt = Date()
        guard let resources = Bundle.main.resourceURL else { appendLog("app resources missing"); return }
        let folder = resources.appendingPathComponent("runtime")
        let binary = folder.appendingPathComponent("node")
        let server = folder.appendingPathComponent("build/desktop-source/server.js")
        guard FileManager.default.isExecutableFile(atPath: binary.path), FileManager.default.fileExists(atPath: server.path) else {
            appendLog("desktop runtime is missing from the app bundle")
            return
        }
        let p = Process()
        p.executableURL = binary
        p.arguments = [server.path]
        p.currentDirectoryURL = folder.appendingPathComponent("build/desktop-source")
        // Never inherit database credentials or signing secrets into the desktop runtime.
        p.environment = ["PATH": "/usr/bin:/bin", "HOME": NSHomeDirectory(), "NODE_ENV": "production", "HOSTNAME": "127.0.0.1", "PORT": "13200", "ATLAS_RUNTIME": "desktop", "ATLAS_DATA_API_URL": dataServiceURL.absoluteString, "NEXT_TELEMETRY_DISABLED": "1"]
        bindOutput(p, name: "workspace")
        do { try p.run(); runtime = p; appendLog("workspace process started") } catch { appendLog("workspace failed to start: \(error.localizedDescription)") }
    }
    @objc func forceReconnect() {
        appendLog("reconnect requested")
        workspaceReady = false
        runtime?.terminate(); runtime = nil
        tunnel?.terminate(); tunnel = nil
        lastRuntimeAttempt = .distantPast
        lastTunnelAttempt = .distantPast
        reconnect()
    }
    @objc func reconnect() {
        generation += 1
        let token = generation
        errorPanel.isHidden = true
        status.stringValue = "Starting desktop workspace…"
        window.subtitle = status.stringValue
        appendLog("connecting, attempt group \(token)")
        ensureTunnel()
        ensureRuntime()
        timer?.invalidate()
        var attempts = 0
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] timer in
            guard let self else { timer.invalidate(); return }
            guard token == self.generation else { timer.invalidate(); return }
            attempts += 1
            self.ensureTunnel()
            self.ensureRuntime()
            var request = URLRequest(url: self.localURL.appendingPathComponent("login"))
            request.timeoutInterval = 2
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let ephemeral = URLSession(configuration: .ephemeral)
            ephemeral.dataTask(with: request) { _, response, error in
                ephemeral.finishTasksAndInvalidate()
                DispatchQueue.main.async {
                    guard token == self.generation else { return }
                    if let response = response as? HTTPURLResponse, response.statusCode == 200 {
                        timer.invalidate()
                        self.appendLog("workspace ready")
                        self.load()
                        return
                    }
                    if attempts == 1 || attempts % 10 == 0 {
                        let detail = error?.localizedDescription ?? "HTTP \((response as? HTTPURLResponse)?.statusCode ?? 0)"
                        self.appendLog("still waiting for workspace (\(detail))")
                    }
                    if attempts >= 12 {
                        self.status.stringValue = "Still connecting… Atlas will keep trying"
                        self.window.subtitle = self.status.stringValue
                        if !self.workspaceReady { self.errorPanel.isHidden = false }
                    }
                }
            }.resume()
        }
    }
    func load() {
        errorPanel.isHidden = true
        status.stringValue = "Opening workspace…"
        window.subtitle = status.stringValue
        web.load(URLRequest(url: serverURL.appendingPathComponent("home")))
    }
    func showError() {
        status.stringValue = "Still connecting… records remain on the server"
        window.subtitle = status.stringValue
        if !workspaceReady { errorPanel.isHidden = false }
    }
    @objc func connection() {
        let alert=NSAlert();alert.messageText="Atlas connection";alert.informativeText="Choose the secured data service. Atlas software runs on this Mac; shared records stay on the server. Changing connection signs you out."
        let input=NSTextField(string:dataServiceURL.absoluteString);input.frame=NSRect(x:0,y:0,width:380,height:28)
        alert.accessoryView=input;alert.addButton(withTitle:"Connect");alert.addButton(withTitle:"Cancel")
        guard alert.runModal() == .alertFirstButtonReturn else{return}
        guard let url=URL(string:input.stringValue.trimmingCharacters(in:.whitespacesAndNewlines)),url.user==nil,url.password==nil,url.query==nil,url.fragment==nil,(url.path.isEmpty || url.path=="/"),url.host != nil,(url.scheme=="https" || url==dataURL) else {
            let error=NSAlert();error.messageText="Use an HTTPS data-service address or http://127.0.0.1:13100 for private testing.";error.runModal();return
        }
        web.stopLoading()
        web.configuration.websiteDataStore.removeData(ofTypes:WKWebsiteDataStore.allWebsiteDataTypes(),modifiedSince:Date.distantPast) { [weak self] in
            DispatchQueue.main.async {
                UserDefaults.standard.set(url.absoluteString, forKey: "dataServiceURL")
                self?.runtime?.terminate(); self?.runtime = nil
                self?.tunnel?.terminate(); self?.tunnel = nil
                self?.lastRuntimeAttempt = .distantPast
                self?.lastTunnelAttempt = .distantPast
                self?.workspaceReady = false
                self?.reconnect()
            }
        }
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!) {guard webView === web else {return}; workspaceReady=true; errorPanel.isHidden=true;status.stringValue="Desktop software · server data";window.subtitle=status.stringValue; appendLog("workspace open")}
    func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error) {noteNavigationFailure(webView, error)}
    func webView(_ webView:WKWebView,didFail navigation:WKNavigation!,withError error:Error) {noteNavigationFailure(webView, error)}
    func webViewWebContentProcessDidTerminate(_ webView:WKWebView) {guard webView === web else {return}; appendLog("workspace process terminated"); workspaceReady=false; reconnect()}
    func noteNavigationFailure(_ webView: WKWebView, _ error: Error) {
        guard webView === web, (error as NSError).code != NSURLErrorCancelled else { return }
        appendLog("page failed: \(error.localizedDescription)")
        guard !workspaceReady else { return }
        if timer?.isValid != true { reconnect() } else { showError() }
    }
    func sameOrigin(_ url:URL)->Bool {url.scheme==serverURL.scheme && url.host==serverURL.host && url.port==serverURL.port}
    func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping (WKNavigationActionPolicy)->Void) {
        guard let url=action.request.url else{decisionHandler(.cancel);return}
        if sameOrigin(url) {decisionHandler(action.shouldPerformDownload ? .download : .allow);return}
        if action.navigationType == .linkActivated && ["https","mailto","tel"].contains(url.scheme ?? "") {NSWorkspace.shared.open(url)}
        decisionHandler(.cancel)
    }
    func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for action:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView? {
        guard let url=action.request.url else {return nil}
        let blank = url.absoluteString == "about:blank" || url.absoluteString.isEmpty
        if sameOrigin(url) || blank {return presentWorkspace(configuration: configuration)}
        if ["https","mailto","tel"].contains(url.scheme ?? "") {NSWorkspace.shared.open(url)}
        return nil
    }
    func webView(_ webView:WKWebView,runOpenPanelWith parameters:WKOpenPanelParameters,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping ([URL]?)->Void) {
        let panel=NSOpenPanel();panel.allowsMultipleSelection=parameters.allowsMultipleSelection;panel.canChooseDirectories=false
        panel.beginSheetModal(for:hostWindow(for: webView)){result in completionHandler(result == .OK ? panel.urls : nil)}
    }
    func webView(_ webView:WKWebView,decidePolicyFor response:WKNavigationResponse,decisionHandler:@escaping (WKNavigationResponsePolicy)->Void) {decisionHandler(response.response.mimeType == "text/csv" || !response.canShowMIMEType ? .download : .allow)}
    func webView(_ webView:WKWebView,navigationAction:WKNavigationAction,didBecome download:WKDownload) {download.delegate=self}
    func webView(_ webView:WKWebView,navigationResponse:WKNavigationResponse,didBecome download:WKDownload) {download.delegate=self}
    func download(_ download:WKDownload,decideDestinationUsing response:URLResponse,suggestedFilename:String,completionHandler:@escaping (URL?)->Void) {
        // Explicit user-requested CSV exports are permitted; no automatic record cache.
        guard let url=response.url, sameOrigin(url), ["/api/planning/export","/api/stock/export","/api/sales/export","/api/logistics/courier","/api/audit/report"].contains(url.path), response.mimeType == "text/csv" else {
            completionHandler(nil)
            let alert=NSAlert();alert.messageText="Download unavailable"
            alert.informativeText="Use a CSV export from Planning, Inventory, Sales, Logistics or Audit."
            alert.beginSheetModal(for:NSApp.keyWindow ?? window)
            return
        }
        let panel=NSSavePanel();panel.allowedContentTypes=[.commaSeparatedText]
        panel.nameFieldStringValue=URL(fileURLWithPath:suggestedFilename).lastPathComponent
        panel.beginSheetModal(for:NSApp.keyWindow ?? window){result in completionHandler(result == .OK ? panel.url : nil)}
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool {true}
    func applicationWillTerminate(_ notification:Notification) {timer?.invalidate();runtime?.terminate();tunnel?.terminate()}
}
let app=NSApplication.shared
let delegate=AtlasApp()
app.delegate=delegate;app.setActivationPolicy(.regular);app.run()
