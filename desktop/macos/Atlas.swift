import AppKit
import WebKit

// Thin client: all business rules, modules and records remain on the Atlas service.
final class AtlasApp: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var status: NSTextField!
    var tunnel: Process?
    var errorPanel: NSStackView!
    var timer: Timer?
    let localURL = URL(string: "http://127.0.0.1:13100")!
    var serverURL: URL { URL(string: UserDefaults.standard.string(forKey: "serverURL") ?? localURL.absoluteString) ?? localURL }

    func applicationDidFinishLaunching(_ notification: Notification) {
        makeMenu()
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent() // No persistent business-data cache on this Mac.
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0,y: 0,width: 1360,height: 880), styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = "Atlas — Business workspace"
        window.minSize = NSSize(width: 430,height: 600)
        window.center()
        let root = NSView()
        window.contentView = root
        let bar = NSStackView()
        bar.orientation = .horizontal; bar.spacing = 12; bar.edgeInsets = NSEdgeInsets(top: 8,left: 16,bottom: 8,right: 16)
        bar.wantsLayer = true; bar.layer?.backgroundColor = NSColor(calibratedRed: 0.06,green: 0.11,blue: 0.21,alpha: 1).cgColor
        let brand = NSTextField(labelWithString: "ATLAS")
        brand.font = .systemFont(ofSize: 14,weight: .bold); brand.textColor = .white
        status = NSTextField(labelWithString: "Connecting to private test server…")
        status.font = .systemFont(ofSize: 11); status.textColor = .lightGray
        let spacer = NSView(); spacer.setContentHuggingPriority(.defaultLow,for: .horizontal)
        bar.addArrangedSubview(brand); bar.addArrangedSubview(status); bar.addArrangedSubview(spacer)
        for (title, selector) in [("Back",#selector(back)),("Reload",#selector(reload)),("Connection",#selector(connection))] {
            let b=NSButton(title:title,target:self,action:selector); b.bezelStyle = .rounded; bar.addArrangedSubview(b)
        }
        for v in [bar,web!] { v.translatesAutoresizingMaskIntoConstraints=false; root.addSubview(v) }
        NSLayoutConstraint.activate([bar.topAnchor.constraint(equalTo:root.topAnchor),bar.leadingAnchor.constraint(equalTo:root.leadingAnchor),bar.trailingAnchor.constraint(equalTo:root.trailingAnchor),bar.heightAnchor.constraint(equalToConstant:48),web.topAnchor.constraint(equalTo:bar.bottomAnchor),web.bottomAnchor.constraint(equalTo:root.bottomAnchor),web.leadingAnchor.constraint(equalTo:root.leadingAnchor),web.trailingAnchor.constraint(equalTo:root.trailingAnchor)])
        errorPanel = NSStackView(); errorPanel.orientation = .vertical; errorPanel.spacing = 16; errorPanel.alignment = .centerX
        errorPanel.wantsLayer = true; errorPanel.layer?.backgroundColor = NSColor.windowBackgroundColor.cgColor; errorPanel.layer?.cornerRadius = 20
        errorPanel.edgeInsets = NSEdgeInsets(top:32,left:32,bottom:32,right:32)
        let heading=NSTextField(labelWithString:"Connect to your workspace")
        heading.font = .systemFont(ofSize:24,weight:.semibold)
        let body=NSTextField(wrappingLabelWithString:"Atlas stores your records on the server. Check your internet connection, then reconnect. No local database is started.")
        body.alignment = .center; body.preferredMaxLayoutWidth=360
        errorPanel.addArrangedSubview(heading); errorPanel.addArrangedSubview(body)
        errorPanel.addArrangedSubview(NSButton(title:"Reconnect",target:self,action:#selector(reconnect)))
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
        view.addItem(withTitle:"Reload",action:#selector(reload),keyEquivalent:"r").target=self
        viewItem.submenu=view;menu.addItem(viewItem);NSApp.mainMenu=menu
    }
    @objc func back() {web.goBack()}
    @objc func reload() {errorPanel.isHidden=true;web.reload()}
    @objc func reconnect() {
        errorPanel.isHidden=true; status.stringValue="Connecting…"
        if serverURL == localURL {
            if tunnel?.isRunning != true {
                let p=Process();p.executableURL=URL(fileURLWithPath:"/usr/bin/ssh")
                p.arguments=["-i",NSHomeDirectory()+"/.ssh/atlas_test_ed25519","-N","-T","-o","BatchMode=yes","-o","StrictHostKeyChecking=yes","-o","ConnectTimeout=10","-o","ExitOnForwardFailure=yes","-o","ServerAliveInterval=20","-o","ServerAliveCountMax=3","-L","127.0.0.1:13100:127.0.0.1:3100","atlas-connect@217.154.51.15"]
                p.standardOutput=FileHandle.nullDevice;p.standardError=FileHandle.nullDevice
                do {try p.run();tunnel=p} catch {showError();return}
            }
            timer?.invalidate()
            var attempts=0
            timer=Timer.scheduledTimer(withTimeInterval:1,repeats:true){ [weak self] timer in
                guard let self=self else {timer.invalidate();return}
                attempts += 1
                var request=URLRequest(url:self.localURL.appendingPathComponent("login"));request.timeoutInterval=2
                URLSession.shared.dataTask(with:request){ _,response,_ in
                    DispatchQueue.main.async {
                        if let response=response as? HTTPURLResponse, response.statusCode==200 {
                            timer.invalidate();self.load()
                        } else if attempts>=15 {timer.invalidate();self.showError()}
                    }
                }.resume()
            }
        } else {tunnel?.terminate();tunnel=nil;load()}
    }
    func load() {web.load(URLRequest(url:serverURL.appendingPathComponent("home")))}
    func showError() {status.stringValue="Disconnected · data remains on server";errorPanel.isHidden=false}
    @objc func connection() {
        let alert=NSAlert();alert.messageText="Atlas connection";alert.informativeText="Use the private SSH test connection, or an HTTPS Atlas server. Your SSH key stays on this Mac. Changing server signs you out."
        let input=NSTextField(string:serverURL.absoluteString);input.frame=NSRect(x:0,y:0,width:380,height:28)
        alert.accessoryView=input;alert.addButton(withTitle:"Connect");alert.addButton(withTitle:"Cancel")
        guard alert.runModal() == .alertFirstButtonReturn else{return}
        guard let url=URL(string:input.stringValue.trimmingCharacters(in:.whitespacesAndNewlines)),url.user==nil,url.password==nil,url.query==nil,url.fragment==nil,(url.path.isEmpty || url.path=="/"),url.host != nil,(url.scheme=="https" || url==localURL) else {
            let error=NSAlert();error.messageText="Use an HTTPS server address or http://127.0.0.1:13100 for private testing.";error.runModal();return
        }
        web.stopLoading()
        web.configuration.websiteDataStore.removeData(ofTypes:WKWebsiteDataStore.allWebsiteDataTypes(),modifiedSince:Date.distantPast) { [weak self] in
            DispatchQueue.main.async {UserDefaults.standard.set(url.absoluteString,forKey:"serverURL");self?.reconnect()}
        }
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!) {errorPanel.isHidden=true;status.stringValue=serverURL==localURL ? "Private SSH test · server data" : "Connected · \(serverURL.host ?? "Atlas")"}
    func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error) {if (error as NSError).code != NSURLErrorCancelled {showError()}}
    func webView(_ webView:WKWebView,didFail navigation:WKNavigation!,withError error:Error) {if (error as NSError).code != NSURLErrorCancelled {showError()}}
    func webViewWebContentProcessDidTerminate(_ webView:WKWebView) {showError()}
    func sameOrigin(_ url:URL)->Bool {url.scheme==serverURL.scheme && url.host==serverURL.host && url.port==serverURL.port}
    func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping (WKNavigationActionPolicy)->Void) {
        guard let url=action.request.url else{decisionHandler(.cancel);return}
        if sameOrigin(url) {decisionHandler(action.shouldPerformDownload ? .download : .allow);return}
        if action.navigationType == .linkActivated && ["https","mailto","tel"].contains(url.scheme ?? "") {NSWorkspace.shared.open(url)}
        decisionHandler(.cancel)
    }
    func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for action:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView? {
        if let url=action.request.url {if sameOrigin(url) {web.load(URLRequest(url:url))} else if ["https","mailto","tel"].contains(url.scheme ?? "") {NSWorkspace.shared.open(url)}};return nil
    }
    func webView(_ webView:WKWebView,runOpenPanelWith parameters:WKOpenPanelParameters,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping ([URL]?)->Void) {
        let panel=NSOpenPanel();panel.allowsMultipleSelection=parameters.allowsMultipleSelection;panel.canChooseDirectories=false
        panel.beginSheetModal(for:window){result in completionHandler(result == .OK ? panel.urls : nil)}
    }
    func webView(_ webView:WKWebView,decidePolicyFor response:WKNavigationResponse,decisionHandler:@escaping (WKNavigationResponsePolicy)->Void) {decisionHandler(response.canShowMIMEType ? .allow : .download)}
    func webView(_ webView:WKWebView,navigationAction:WKNavigationAction,didBecome download:WKDownload) {download.delegate=self}
    func webView(_ webView:WKWebView,navigationResponse:WKNavigationResponse,didBecome download:WKDownload) {download.delegate=self}
    func download(_ download:WKDownload,decideDestinationUsing response:URLResponse,suggestedFilename:String,completionHandler:@escaping (URL?)->Void) {
        let panel=NSSavePanel();panel.nameFieldStringValue=suggestedFilename
        panel.beginSheetModal(for:window){result in completionHandler(result == .OK ? panel.url : nil)}
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool {true}
    func applicationWillTerminate(_ notification:Notification) {timer?.invalidate();tunnel?.terminate()}
}
let app=NSApplication.shared
let delegate=AtlasApp()
app.delegate=delegate;app.setActivationPolicy(.regular);app.run()
