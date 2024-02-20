package main

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"crypto/md5"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math/big"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"plugin"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

type sliceflag []string

func (f *sliceflag) String() string {
	return fmt.Sprintf("%v", []string(*f))
}

func (f *sliceflag) Set(value string) error {
	*f = append(*f, value)
	return nil
}

var iLookup = map[string]interface{}{
	"NewPostAction": NewPostAction,
	"NewMonitor":    NewMonitor,
}

type pluginCall interface {
	Call(func(string) string, http.ResponseWriter, *http.Request) bool
}

type Plugin struct {
	Name string
	Auth bool
	Func func(func(string) string, http.ResponseWriter, *http.Request) bool
}

type Config struct {
	usetls                 bool
	addr, crtfile, keyfile string
	root, prefix, scope    string
	sessionTime            int
	username, password     string
	plugins                map[string]*Plugin
}

func parsePluginStr(pluginstr, binpath string) (Plugin, bool) {
	var _plugin Plugin
	var objCreate interface{}
	paralist := strings.Split(pluginstr, ":")
	ok := true
	_path := paralist[0]
	_func := paralist[1]
	_plugin.Auth = false
	if tmp, err := strconv.ParseBool(paralist[2]); err == nil {
		_plugin.Auth = tmp
	}
	_parastr := paralist[3:]
	_lenpara := len(_parastr) / 2
	_params := make(map[string]interface{}, 0)
	for i := 0; i < _lenpara; i += 2 {
		_params[_parastr[i]] = _parastr[i+1]
	}
	if len(_path) == 0 {
		if objCreate, ok = iLookup[_func]; !ok {
			log.Println("plugin " + _path + " with " + _func + " not found")
			return _plugin, false
		}
	} else {
		if string(_path[0]) != "/" {
			_path = path.Join(binpath, _path)
		}
		if plu, err := plugin.Open(_path); err == nil {
			if objCreate, err = plu.Lookup(_func); err != nil {
				log.Println("plugin " + _path + " with " + _func + " not found")
				return _plugin, false
			}
		} else {
			log.Println("plugin " + _path + " with " + _func + " not found")
			return _plugin, false
		}
	}
	obj := ((objCreate.(func(map[string]interface{}) interface{}))(_params)).(pluginCall)
	_plugin.Func = obj.Call
	_plugin.Name = _func
	return _plugin, true
}

func parseConfig() Config {
	var conf Config
	binpath, _ := os.Executable()
	binpath = filepath.Dir(binpath)
	conf.addr = "[::]:60000"
	conf.usetls = false
	conf.crtfile = ""
	conf.keyfile = ""
	conf.root = path.Join(binpath, "public")
	conf.prefix = "/home"
	conf.scope = "/media"
	conf.sessionTime = 10
	conf.username = "admin"
	conf.password = "admin"
	conf.plugins = make(map[string]*Plugin, 0)
	var config map[string]interface{}
	if len(os.Args) < 2 {
		return conf
	}
	confFile, _ := filepath.Abs(os.Args[1])
	if results, err := ioutil.ReadFile(confFile); err == nil {
		os.Args = append(os.Args[0:1], os.Args[2:]...)
		json.Unmarshal([]byte(string(results)), &config)
		confpath := filepath.Dir(confFile)
		if tmp, ok := config["address"].(string); ok && tmp != "" {
			conf.addr = tmp
		}
		if tmp, ok := config["tls"].(bool); ok {
			conf.usetls = tmp
		}
		if tmpc, ok := config["crtfile"].(string); ok && tmpc != "" {
			if string(tmpc[0]) != "/" {
				tmpc = path.Join(confpath, tmpc)
			}
			if tmpk, ok := config["keyfile"].(string); ok && tmpk != "" {
				if string(tmpk[0]) != "/" {
					tmpk = path.Join(confpath, tmpk)
				}
				conf.crtfile = tmpc
				conf.keyfile = tmpk
			}
		}
		if tmp, ok := config["root"].(string); ok && tmp != "" {
			if string(tmp[0]) != "/" {
				conf.root = path.Join(confpath, tmp)
			} else {
				conf.root = tmp
			}
		}
		if tmp, ok := config["prefix"].(string); ok && tmp != "" {
			conf.prefix = tmp
		}
		if tmp, ok := config["scope"].(string); ok && tmp != "" {
			if string(tmp[0]) != "/" {
				conf.scope = path.Join(confpath, tmp)
			} else {
				conf.scope = tmp
			}
		}
		if tmp, ok := config["username"].(string); ok && tmp != "" {
			conf.username = tmp
		}
		if tmp, ok := config["password"].(string); ok && tmp != "" {
			conf.password = tmp
		}
		if plugins, ok := config["plugins"].([](interface{})); ok {
			var objCreate interface{}
			for i := 0; i < len(plugins); i++ {
				attrs := plugins[i].(map[string]interface{})
				_path := attrs["__PATH__"].(string)
				_func := attrs["__FUNC__"].(string)
				if len(_path) == 0 {
					if objCreate, ok = iLookup[_func]; !ok {
						log.Println("plugin " + _path + " with " + _func + " not found")
						continue
					}
				} else {
					if string(_path[0]) != "/" {
						_path = path.Join(confpath, _path)
					}
					plu, err := plugin.Open(_path)
					if err != nil {
						log.Println("plugin " + _path + " with " + _func + " not found")
						continue
					}
					if objCreate, err = plu.Lookup(_func); err != nil {
						log.Println("plugin " + _path + " with " + _func + " not found")
						continue
					}
				}
				obj := ((objCreate.(func(map[string]interface{}) interface{}))(attrs)).(pluginCall)
				conf.plugins[_func] = &Plugin{Auth: attrs["__AUTH__"].(bool), Func: obj.Call}
			}
		}
	}
	var pluginstrlist sliceflag
	flag.StringVar(&(conf.addr), "addr", conf.addr, "listen address")
	flag.BoolVar(&(conf.usetls), "tls", conf.usetls, "enable https")
	flag.StringVar(&(conf.crtfile), "cert", conf.crtfile, "cert file if use https")
	flag.StringVar(&(conf.keyfile), "key", conf.keyfile, "key file if use https")
	flag.StringVar(&(conf.root), "web", conf.root, "web directory")
	flag.StringVar(&(conf.prefix), "prefix", conf.prefix, "web path prefix for data scope")
	flag.StringVar(&(conf.scope), "scope", conf.scope, "data scope")
	flag.IntVar(&(conf.sessionTime), "session", conf.sessionTime, "session time to auto logout")
	flag.StringVar(&(conf.username), "user", conf.username, "admin username")
	flag.StringVar(&(conf.password), "pass", conf.password, "admin password")
	flag.Var(&pluginstrlist, "plugin", "append a plugin, \"path(empty as inner plugin):func:auth:key:value:key:value...\"")
	flag.Parse()
	for _, value := range pluginstrlist {
		if tmp, ok := parsePluginStr(value, binpath); ok {
			conf.plugins[tmp.Name] = &tmp
		}
	}
	if _, ok := conf.plugins["NewMonitor"]; !ok {
		tmp, _ := parsePluginStr(":NewMonitor:false", binpath)
		conf.plugins["NewMonitor"] = &tmp
	}
	if _, ok := conf.plugins["NewPostAction"]; !ok {
		tmp, _ := parsePluginStr(":NewPostAction:true:maxFromMem:5000000:trashDir:.trash:signPass:pass:signExist:exist:signFail:fail", binpath)
		conf.plugins["NewPostAction"] = &tmp
	}
	return conf
}

func genCert() ([]byte, []byte) {
	max := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, _ := rand.Int(rand.Reader, max)
	subject := pkix.Name{
		Organization:       []string{"Example"},
		OrganizationalUnit: []string{"Example"},
		CommonName:         "Example",
	}
	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject:      subject,
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	pk, _ := rsa.GenerateKey(rand.Reader, 2048)
	derBytes, _ := x509.CreateCertificate(rand.Reader, &template, &template, &pk.PublicKey, pk) //DER 格式
	cert := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	key := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(pk)})
	return cert, key
}

func main() {
	conf := parseConfig()
	static := http.FileServer(http.Dir(path.Join(conf.root)))
	browser := NewSimpServer(map[string]interface{}{"autoIndex": true, "indexPage": path.Join(conf.root, "index.html")}).(*SimpServer)
	auth := NewAuthentication(map[string]interface{}{"username": conf.username, "password": conf.password, "sessionTime": conf.sessionTime}).(*Authentication)
	http.HandleFunc("/", func(Response http.ResponseWriter, Request *http.Request) {
		if auth.Call(Response, Request) {
			return
		}
		prefix := strings.Trim(conf.prefix, "/")
		srcPath := strings.TrimLeft(Request.URL.Path, "/")
		if srcPath == prefix || strings.Index(srcPath, prefix+"/") == 0 {
			genPath := func(_path string) string {
				if _path != "" {
					_prefix := strings.Trim(conf.prefix, "/")
					_path = strings.TrimLeft(_path, "/")
					_path = path.Join(conf.scope, strings.TrimPrefix(_path, _prefix))
				}
				return _path
			}
			if browser.Call(genPath, Response, Request) {
				return
			}
			for _, _plugin := range conf.plugins {
				if _plugin.Auth && auth.TokenCheck(Request) && _plugin.Func(genPath, Response, Request) {
					return
				} else if !_plugin.Auth && _plugin.Func(genPath, Response, Request) {
					return
				}
			}
			fmt.Fprintln(Response, "")
		} else {
			static.ServeHTTP(Response, Request)
		}

	})

	log.Printf("go http server ( pid : %d ) starts at \"%s\"\n", os.Getpid(), conf.addr)
	if conf.usetls {
		_, errCrt := os.Stat(conf.crtfile)
		_, errKey := os.Stat(conf.keyfile)
		if !(errCrt == nil || os.IsExist(errCrt)) || !(errKey == nil || os.IsExist(errKey)) {
			cert, key := genCert()
			pair, _ := tls.X509KeyPair(cert, key)
			srv := http.Server{
				Addr:    conf.addr,
				Handler: nil,
				TLSConfig: &tls.Config{
					Certificates: []tls.Certificate{pair},
				},
			}
			if err := srv.ListenAndServeTLS("", ""); err != nil {
				panic("ListenAndServeTLS: " + err.Error())
			}
		} else {
			if err := http.ListenAndServeTLS(conf.addr, conf.crtfile, conf.keyfile, nil); err != nil {
				panic("ListenAndServeTLS: " + err.Error())
			}
		}
	} else {
		if err := http.ListenAndServe(conf.addr, nil); err != nil {
			panic("ListenAndServe: " + err.Error())
		}
	}
}

// // ----------------------------- Object SimpServer ------------------------------------ //
type SimpServer struct {
	autoIndex bool
	// usePageTemplate bool
	indexPage    string
	signTemplate string
	msgTemplate  string
	getDirSize   bool
	indexList    []string
}

func NewSimpServer(ins map[string]interface{}) interface{} {
	instance := SimpServer{
		autoIndex: true,
		// usePageTemplate: false,
		getDirSize:   false,
		indexPage:    "simp.html",
		signTemplate: "{__SIMPSERVERMESSAGE__}",
		msgTemplate:  "<div style=\"padding:48px;\"><div style=\"font-weight:600;font-size:36px;word-break:break-word;\">" + "{__SIMPSERVERMESSAGE__}" + "</div></div>",
		indexList:    []string{"index.html", "index.htm"},
	}
	// if tmp, ok := ins["usePageTemplate"].(bool); ok {
	// 	instance.usePageTemplate = tmp
	// }
	if tmp, ok := ins["indexPage"].(string); ok {
		instance.indexPage = tmp
	}
	if tmp, ok := ins["signTemplate"].(string); ok {
		instance.msgTemplate = strings.Replace(instance.msgTemplate, instance.signTemplate, tmp, -1)
		instance.signTemplate = tmp
	}
	if tmp, ok := ins["msgTemplate"].(string); ok {
		instance.msgTemplate = tmp
	}
	if tmp, ok := ins["indexList"].([]string); ok && len(tmp) != 0 {
		instance.indexList = tmp
	}
	return &instance
}

func (simp SimpServer) splitStr(str, sep string) []string {
	// splitStr("12  34    56    ", " ") return {12,34,56}
	// func (str string) split(sep string) []string  is not allowed
	// return strings.Split(str, sep) // it would return many "" strings
	result := []string{}
	for {
		str = strings.Trim(str, sep) // delete sep before and after string
		if str == "" {
			break
		}
		// pos can not be 0 or len(str), cuz trim
		if pos := strings.Index(str, sep); pos == -1 {
			result = append(result, str)
			break
		} else {
			result = append(result, str[0:pos])
			str = str[pos:]
		}
	}
	return result
}

func (simp SimpServer) parseRange(contentRange string, filesize int64) [](map[string]int64) {
	// https://blog.csdn.net/thewindkee/article/details/80189434
	// Examples: 1.Range: bytes=1-499 (1-499 Bytes) 2.Range: bytes=-500 (last 500 Bytes)
	// 3. Range: bytes=500- (500-end Bytes) 4.Range: bytes=500-600,601-999
	// Res: Content-Range: bytes (unit first byte pos) - [last byte pos]/[entity length]
	// Examples: Content-Range: bytes 1-499/22400
	start := int64(0)
	end := int64(0)
	results := make([](map[string]int64), 0)
	if !strings.Contains(contentRange, "=") || filesize <= 0 {
		return results
	}
	rangeList := simp.splitStr(contentRange[(strings.Index(contentRange, "=")+1):], ",")
	for i := 0; i < len(rangeList); i++ {
		rangeStr := strings.Trim(rangeList[i], " ")
		startEndPos := strings.Index(rangeStr, "-")
		if startEndPos == -1 {
			return results // not a correct rangeStr
		}
		rangeStart := strings.Trim(rangeStr[0:startEndPos], " ")
		rangeEnd := strings.Trim(rangeStr[(startEndPos+1):], " ")
		if rangeStart == "" && rangeEnd == "" {
			start = 0
			end = filesize - 1
		} else if rangeStart == "" && rangeEnd != "" {
			tmps, _ := strconv.Atoi(rangeEnd)
			start = filesize - int64(tmps)
			end = filesize - 1
		} else if rangeStart != "" && rangeEnd == "" {
			tmps, _ := strconv.Atoi(rangeStart)
			start = int64(tmps)
			end = filesize - 1
		} else if rangeStart != "" && rangeEnd != "" {
			tmps, _ := strconv.Atoi(rangeStart)
			tmpe, _ := strconv.Atoi(rangeEnd)
			start = int64(tmps)
			end = int64(tmpe)
		}
		results = append(results, map[string]int64{"start": start, "end": end})
	}
	return results
}

func (simp SimpServer) scanIndex(srcPath string) string {
	srcPath = strings.TrimSuffix(srcPath, "/")
	webPage := ""
	dir, err := os.Open(srcPath)
	if err != nil {
		return webPage
	}
	filenames, err := dir.Readdirnames(0) // <=0 is all
	if err != nil || len(filenames) == 0 {
		dir.Close()
		return webPage
	}
	pageRank := -1
	for _, name := range filenames {
		rank := strings.Index(strings.Join(simp.indexList, " "), name)
		if rank != -1 && (pageRank == -1 || rank < pageRank) {
			pageRank = rank
			webPage = name
		}
	}
	dir.Close()
	return webPage
}

func (simp SimpServer) ReadDir(srcPath string) string {
	type dirInfo struct{ Name, Size, Mode, Mtim, Ctim, Err string }
	type fileInfo struct{ Name, Size, Mode, Mtim, Ctim, FileNum, FolderNum string }
	var info dirInfo
	var fileList, folderList []fileInfo

	var dirInfo2Html = func(info dirInfo, folderList, fileList []fileInfo) string {
		var buf bytes.Buffer
		buf.WriteString("<pre name=\"" + info.Name + "\" size=\"" + info.Size + "\" mode=\"" + info.Mode)
		buf.WriteString("\" mtim=\"" + info.Mtim + "\" ctim=\"" + info.Ctim + "\" error=\"" + info.Err)
		buf.WriteString("\" filenum=\"" + strconv.FormatInt(int64(len(fileList)), 10))
		buf.WriteString("\" foldernum=\"" + strconv.FormatInt(int64(len(folderList)), 10))
		buf.WriteString("\" > <div type=\"folder\">")
		for _, fi := range folderList {
			buf.WriteString("<a href=\"" + fi.Name + "\" size=\"" + fi.Size + "\" mode=\"" + fi.Mode)
			buf.WriteString("\" name=\"" + fi.Name + "\" mtim=\"" + fi.Mtim + "\" ctim=\"" + fi.Ctim)
			buf.WriteString("\" filenum=\"" + fi.FileNum + "\" foldernum=\"" + fi.FolderNum)
			buf.WriteString("\">" + fi.Name + "</a><br>")
		}
		buf.WriteString("</div> <div type=\"file\">")
		for _, fi := range fileList {
			buf.WriteString("<a href=\"" + fi.Name + "\" size=\"" + fi.Size + "\" mode=\"" + fi.Mode)
			buf.WriteString("\" name=\"" + fi.Name + "\" mtim=\"" + fi.Mtim + "\" ctim=\"" + fi.Ctim)
			buf.WriteString("\" filenum=\"" + fi.FileNum + "\" foldernum=\"" + fi.FolderNum)
			buf.WriteString("\">" + fi.Name + "</a><br>")
		}
		buf.WriteString("</div></pre>")
		return buf.String()
	}

	infoSize := int64(0)
	srcPath = strings.TrimSuffix(srcPath, "/")
	if stat, err := os.Stat(srcPath); err == nil {
		info.Name = stat.Name()
		info.Size = strconv.FormatInt(int64(stat.Size()), 10)
		info.Mode = stat.Mode().String()
		info.Mtim = strconv.FormatInt(stat.ModTime().Unix(), 10)
		if stat.Sys() != nil {
			sysStat := stat.Sys().(*syscall.Stat_t)
			CtimSec, _ := sysStat.Ctim.Unix()
			info.Ctim = strconv.FormatInt(CtimSec, 10)
		}
	} else {
		info.Err = "Error: directory (" + info.Name + ") stat error."
		return dirInfo2Html(info, folderList, fileList)
	}
	dir, err := os.Open(srcPath)
	if err != nil {
		dir.Close()
		info.Err = "Error: directory (" + info.Name + ") open error."
		return dirInfo2Html(info, folderList, fileList)
	}
	defer dir.Close()
	filenames, err := dir.Readdirnames(0) // <=0 is all
	if err != nil {
		info.Err = "Error: directory (" + info.Name + ") read error."
		return dirInfo2Html(info, folderList, fileList)
	} else if len(filenames) == 0 {
		info.Err = "" // no file found with no err
		return dirInfo2Html(info, folderList, fileList)
	}
	for _, name := range filenames {
		// get subPath (with symlink)
		subPath := path.Join(srcPath, name)
		if tmpPath, err := os.Readlink(subPath); err == nil {
			subPath = tmpPath
		}
		if strings.LastIndex(subPath, "/") == len(subPath)-1 {
			subPath = subPath[0 : len(subPath)-1]
		}
		// check stat
		if stat, err := os.Stat(subPath); err == nil {
			item := fileInfo{
				name,
				strconv.FormatInt(int64(stat.Size()), 10),
				stat.Mode().String(),
				strconv.FormatInt(stat.ModTime().Unix(), 10),
				"",
				"",
				"",
			}
			if stat.Sys() != nil {
				sysStat := stat.Sys().(*syscall.Stat_t)
				CtimSec, _ := sysStat.Ctim.Unix()
				item.Ctim = strconv.FormatInt(CtimSec, 10)
			}
			if stat.IsDir() {
				fileNum := int64(0)
				folderNum := int64(0)
				if simp.getDirSize {
					dirSize := int64(0)
					err := filepath.Walk(subPath, func(pathname string, info os.FileInfo, err error) error {
						if err != nil {
							return err
						}
						if !info.IsDir() {
							dirSize += info.Size()
						}
						if filepath.Dir(pathname) == subPath {
							if info.IsDir() {
								folderNum += 1
							} else {
								fileNum += 1
							}
						}
						return nil
					})
					if err == nil {
						item.Size = strconv.FormatInt(dirSize, 10)
						item.FileNum = strconv.FormatInt(fileNum, 10)
						item.FolderNum = strconv.FormatInt(folderNum, 10)
					}
				} else {
					if dir, err := ioutil.ReadDir(subPath); err == nil {
						for _, fi := range dir {
							if fi.IsDir() {
								folderNum += 1
							} else {
								fileNum += 1
							}
						}
						item.FileNum = strconv.FormatInt(fileNum, 10)
						item.FolderNum = strconv.FormatInt(folderNum, 10)
					}
				}
				folderList = append(folderList, item)
			} else {
				fileList = append(fileList, item)
			}
		}
		// continue if err != nil, maybe permission denied
	}
	// get info.Size
	if simp.getDirSize {
		for _, item := range fileList {
			size, _ := strconv.Atoi(item.Size)
			infoSize += int64(size)
		}
		for _, item := range folderList {
			size, _ := strconv.Atoi(item.Size)
			infoSize += int64(size)
		}
		info.Size = strconv.FormatInt(int64(infoSize), 10)
	}

	return dirInfo2Html(info, folderList, fileList)
}

func (simp SimpServer) SendFile(octet, omitIndex bool, srcPath string, Response http.ResponseWriter, Request *http.Request) {
	// console.log(Request.headers); // Request headers: lower litter char!
	start := int64(0)
	end := int64(0)
	fileName := path.Base(srcPath)
	stats, errs := os.Stat(srcPath)
	fp, erro := os.Open(srcPath)
	// 404 Not Found: return; 302 Found: redirect to webPage; 200 OK: send indexPage;
	if errs != nil || erro != nil {
		ContentType := "text/html; charset=utf-8"
		message := []byte(strings.Replace(simp.msgTemplate, simp.signTemplate, "Error: file ("+fileName+") open error!", -1))
		if octet {
			ContentType = "application/octet-stream"
			message = make([]byte, 0)
		}
		Response.Header().Set("Content-Type", ContentType)
		Response.Header().Set("Content-Length", strconv.FormatInt(int64(len(message)), 10))
		Response.WriteHeader(404)
		Response.Write(message)
		fp.Close()
		return
	} else if stats.IsDir() {
		StatusCode := 404
		ContentType := "text/html; charset=utf-8"
		message := []byte(strings.Replace(simp.msgTemplate, simp.signTemplate, "Error: file ("+fileName+") open error!", -1))
		if octet {
			ContentType = "application/octet-stream"
			message = make([]byte, 0)
		} else if webPage := simp.scanIndex(srcPath); !omitIndex && webPage != "" {
			StatusCode = 302
			message = make([]byte, 0)
			Response.Header().Set("Location", path.Join(Request.URL.Path, webPage))
		} else if simp.autoIndex {
			if content, err := ioutil.ReadFile(simp.indexPage); simp.indexPage != "" && err == nil {
				StatusCode = 200
				message = content
				// if simp.usePageTemplate {
				// 	message = []byte(strings.Replace(string(content), simp.signTemplate, simp.ReadDir(srcPath), 1))
				// }
			} else {
				message = []byte(simp.ReadDir(srcPath))
			}
		}
		Response.Header().Set("Content-Type", ContentType)
		Response.Header().Set("Cache-Control", "public, max-age=0")
		Response.Header().Set("Content-Disposition", "inline")
		Response.Header().Set("Content-Length", strconv.FormatInt(int64(len(message)), 10))
		Response.WriteHeader(StatusCode)
		Response.Write(message)
		fp.Close()
		return
	}

	defer fp.Close()
	fileSize := stats.Size()
	tmpName := strings.Replace(url.QueryEscape(stats.Name()), "+", "%20", -1) // encodeURIComponent, not url.PathEscape(str)
	LastModified := stats.ModTime().Format(time.RFC1123)
	ContentType := mime.TypeByExtension(path.Ext(srcPath))
	if ContentType == "" {
		ContentType = "application/octet-stream"
	}
	Etag := "W/\"" + strconv.FormatInt(fileSize, 10) + "-" + strconv.FormatInt(stats.ModTime().Unix(), 10) + "\""
	ContentDisposition := "filename=\"" + tmpName + "\"; filename*=utf-8''" + tmpName
	if octet {
		ContentDisposition = "attachment;" + ContentDisposition
	}
	Response.Header().Set("Accpet-Ranges", "bytes")
	Response.Header().Set("Cache-Control", "public, max-age=0")
	Response.Header().Set("Last-Modified", LastModified)
	Response.Header().Set("Etag", Etag)
	Response.Header().Set("Content-Disposition", ContentDisposition)
	Response.Header().Set("Content-type", ContentType)
	Response.Header().Set("Access-Control-Allow-Origin", "*")
	// 304 Not Modified: return;
	if Request.Header.Get("if-modified-since") == LastModified || Request.Header.Get("if-none-match") == Etag {
		Response.Header().Set("Content-Length", "0")
		Response.WriteHeader(304)
		Response.Write(make([]byte, 0))
		return
	}
	// 416 Range Not Satisfiable: return; 206 Partial Content; 200 OK;
	if Request.Header.Get("range") == "" {
		start = 0
		end = fileSize - 1
		Response.Header().Set("Content-Length", strconv.FormatInt(fileSize, 10))
		Response.WriteHeader(200)
	} else if ranges := simp.parseRange(Request.Header.Get("range"), fileSize); len(ranges) != 0 {
		// only send the first
		start = ranges[0]["start"]
		end = ranges[0]["end"]
		ContentRange := "bytes " + strconv.FormatInt(start, 10) + "-" + strconv.FormatInt(end, 10) + "/" + strconv.FormatInt(fileSize, 10)
		Response.Header().Set("Content-Length", strconv.FormatInt(end-start+1, 10))
		Response.Header().Set("Content-Range", ContentRange)
		Response.WriteHeader(206)
	} else {
		Response.Header().Set("Content-Type", "application/octet-stream")
		Response.Header().Set("Content-Length", "0")
		Response.WriteHeader(416)
		Response.Write(make([]byte, 0))
		return
	}
	// send Response Content
	fp.Seek(start, 0)
	for {
		buffer := make([]byte, 4096)
		if n, _ := fp.Read(buffer); n == 0 {
			return
		} else {
			if n < 4096 {
				buffer = buffer[0:n]
			}
			if (start + int64(n)) >= (end + 1) {
				buffer = buffer[0:(end - start + 1)]
			} else {
				start += int64(n)
			}
		}
		if _, err := Response.Write(buffer); err != nil {
			// when in range mode, connection may be reset by peer
			return
		}
	}
}

func (simp SimpServer) Call(genPath func(string) string, Response http.ResponseWriter, Request *http.Request) bool {
	query, _ := url.ParseQuery(Request.URL.RawQuery)
	method := strings.Join(query["method"], "")
	omitIndex := strings.Join(query["omitIndex"], "") != ""
	srcPath := genPath(Request.URL.Path)
	switch method {
	case "":
		simp.SendFile(false, omitIndex, srcPath, Response, Request)
	case "getfile":
		simp.SendFile(true, false, srcPath, Response, Request)
	case "getdir":
		StatusCode := 200
		ContentType := "text/html; charset=utf-8"
		message := []byte(simp.ReadDir(srcPath))
		Response.Header().Set("Content-Type", ContentType)
		Response.Header().Set("Cache-Control", "public, max-age=0")
		Response.Header().Set("Content-Disposition", "inline")
		Response.Header().Set("Content-Length", strconv.FormatInt(int64(len(message)), 10))
		Response.WriteHeader(StatusCode)
		Response.Write(message)
	default:
		return false
	}
	return true
}

// ------------------------------ Object Authenticate ------------------------------ //
type Authentication struct {
	username, password string
	sessionTime        int
	tokenLock          *sync.Mutex
	tokenList          map[string]string
}

func NewAuthentication(ins map[string]interface{}) interface{} {
	instance := Authentication{
		username:    "",
		password:    "123456",
		sessionTime: 10,
		tokenLock:   new(sync.Mutex),
		tokenList:   make(map[string]string),
	}
	if tmp, ok := ins["username"].(string); ok {
		instance.username = tmp
	}
	if tmp, ok := ins["password"].(string); ok {
		instance.password = tmp
	}
	if tmp, ok := ins["sessionTime"].(float64); ok && tmp > 0 {
		instance.sessionTime = int(tmp)
	}
	return &instance
}

func (auth *Authentication) md5Crypto(str string) string {
	hash := md5.New()
	_, err := hash.Write([]byte(str))
	if err != nil {
		return err.Error()
	}
	cryStr := hex.EncodeToString(hash.Sum([]byte("")))
	return string(cryStr)
}

func (auth *Authentication) CheckToken(token string) bool {
	authStatus := false
	now := int64(time.Now().Unix())
	auth.tokenLock.Lock()
	for key, oldToken := range auth.tokenList {
		time, _ := strconv.Atoi(key[4:])
		if (now - int64(time)) > int64(auth.sessionTime*60) {
			delete(auth.tokenList, key)
		} else if oldToken == token {
			delete(auth.tokenList, key)
			newKey := "time" + strconv.FormatInt(now, 10)
			auth.tokenList[newKey] = token
			authStatus = true
			break
		}
	}
	auth.tokenLock.Unlock()
	return authStatus
}

func (auth *Authentication) AuthToken(token string) string {
	newToken := ""
	authKey := auth.md5Crypto(auth.username + auth.password)
	if token == authKey {
		now := int64(time.Now().Unix())
		newKey := "time" + strconv.FormatInt(now, 10)
		newToken = auth.md5Crypto("token" + newKey + "end")
		auth.tokenLock.Lock()
		auth.tokenList[newKey] = newToken
		auth.tokenLock.Unlock()
	}
	return newToken
}

func (auth *Authentication) AuthClose(token string) bool {
	authStatus := false
	auth.tokenLock.Lock()
	for key, oldToken := range auth.tokenList {
		if oldToken == token {
			delete(auth.tokenList, key)
			authStatus = true
			break
		}
	}
	auth.tokenLock.Unlock()
	return authStatus
}

func (auth *Authentication) TokenCheck(Request *http.Request) bool {
	base64info := strings.TrimSpace(strings.TrimLeft(Request.Header.Get("Authorization"), "Basic"))
	if authinfo, err := base64.StdEncoding.DecodeString(base64info); err == nil {
		return auth.CheckToken(strings.TrimSpace(string(authinfo)))
	}
	return false
}

func (auth *Authentication) Call(Response http.ResponseWriter, Request *http.Request) bool {
	base64info := strings.TrimSpace(strings.TrimLeft(Request.Header.Get("Authorization"), "Basic"))
	if authinfo, err := base64.StdEncoding.DecodeString(base64info); err == nil {
		info := strings.ToLower(string(authinfo))
		if strings.Index(info, "auth") == 0 {
			fmt.Fprintln(Response, auth.AuthToken(strings.TrimSpace(string(authinfo[4:]))))
			return true
		} else if strings.Index(info, "close") == 0 {
			fmt.Fprintln(Response, auth.AuthClose(strings.TrimSpace(string(authinfo[5:]))))
			return true
		}
	}
	return false
}

// --------------------------- INNER PLUGINS --------------------------- //

type PostAction struct {
	maxFormMem                    int
	trashDir                      string
	signPass, signExist, signFail string
}

func NewPostAction(ins map[string]interface{}) interface{} {
	instance := PostAction{
		maxFormMem: 5 * 1024 * 1024, // max file memory 5M, the rest would be stored in tmp disk file
		trashDir:   ".trash",
		signPass:   "pass",
		signExist:  "exist",
		signFail:   "fail",
	}
	if tmp, ok := ins["maxFormMem"].(float64); ok && tmp > 0 {
		instance.maxFormMem = int(tmp)
	}
	if tmp, ok := ins["maxFormMem"].(string); ok {
		if value, err := strconv.ParseInt(tmp, 10, 64); err == nil && value > 0 {
			instance.maxFormMem = int(value)
		}
	}
	if tmp, ok := ins["trashDir"].(string); ok && tmp != "" {
		instance.trashDir = tmp
	}
	if tmp, ok := ins["signPass"].(string); ok && tmp != "" {
		instance.signPass = tmp
	}
	if tmp, ok := ins["signExist"].(string); ok && tmp != "" {
		instance.signExist = tmp
	}
	if tmp, ok := ins["signFail"].(string); ok && tmp != "" {
		instance.signFail = tmp
	}
	return &instance
}

func (pact PostAction) mkdir(srcPath string) string {
	// assert srcPath not exist
	if _, err := os.Stat(srcPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	if err := os.MkdirAll(srcPath, os.ModePerm); err != nil {
		log.Println("mkdir:", srcPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("mkdir:", srcPath, " success.")
	return pact.signPass
}

func (pact PostAction) mkfile(srcPath string, content []byte) string {
	// assert srcPath not exist
	if _, err := os.Stat(srcPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	file, err := os.OpenFile(srcPath, os.O_WRONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		file.Close()
		log.Println("mkfile:", srcPath, " error: ", err.Error())
		return pact.signFail
	}
	file.Write(content)
	file.Close()
	log.Println("mkfile:", srcPath, " success.")
	return pact.signPass
}

func (pact PostAction) remove(srcPath string) string {
	dirPath := srcPath[0:strings.LastIndex(srcPath, "/")]
	name := srcPath[strings.LastIndex(srcPath, "/")+1:]
	trashPath := dirPath + "/" + pact.trashDir
	trashFile := trashPath + "/" + name
	// check if in trash already
	if strings.Contains(dirPath, pact.trashDir) {
		return pact.signExist
	}
	// check or make trash dir
	if _, err := os.Stat(trashPath); !(err == nil || os.IsExist(err)) {
		if err := os.MkdirAll(trashPath, os.ModePerm); err != nil {
			log.Println("remove:", srcPath, " error: ", err.Error())
			return pact.signFail
		}
	}
	// check if filename already in trash
	if _, err := os.Stat(trashFile); err == nil || os.IsExist(err) {
		trashFile += "_" + strconv.FormatInt(time.Now().Unix(), 10)
	}
	// rename
	if err := os.Rename(srcPath, trashFile); err != nil {
		log.Println("remove:", srcPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("remove:", srcPath, " success.")
	return pact.signPass
}

func (pact PostAction) rename(srcPath, dstPath string) string {
	// assert dstPath not exist
	if _, err := os.Stat(dstPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	// rename
	if err := os.Rename(srcPath, dstPath); err != nil {
		log.Println("rename", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("rename", srcPath, " to ", dstPath, " success.")
	return pact.signPass
}

func (pact PostAction) copyto(srcPath, dstPath string) string {
	// assert srtPath is not dir
	if stat, err := os.Stat(srcPath); err != nil || stat.IsDir() {
		return pact.signFail
	}
	// assert dstPath is not exist
	if _, err := os.Stat(dstPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	src, err := os.Open(srcPath)
	if err != nil {
		src.Close()
		log.Println("copy:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	dst, err := os.OpenFile(dstPath, os.O_WRONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		dst.Close()
		log.Println("copy:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	defer src.Close()
	defer dst.Close()
	if _, err := io.Copy(dst, src); err != nil {
		log.Println("copy:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("copy:", srcPath, " to ", dstPath, " success.")
	return pact.signPass
}

func (pact PostAction) arcZip(srcPath, dstPath string) string {
	srcPath = strings.TrimRight(srcPath, "/\\") // make srcPath ..../a or a
	// assert srcPath exist
	if _, err := os.Stat(srcPath); err != nil {
		return pact.signFail
	}
	// assert dstPath not exist
	if _, err := os.Stat(dstPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	// create dstFile
	zipfile, err := os.Create(dstPath)
	if err != nil {
		zipfile.Close()
		log.Println("zip:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	archive := zip.NewWriter(zipfile)
	defer zipfile.Close()
	defer archive.Close()
	// for all (recursively) files under srcPath
	err = filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		header.Name = strings.TrimPrefix(path, filepath.Dir(srcPath)+"/")
		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}
		if writer, err := archive.CreateHeader(header); err == nil {
			if !info.IsDir() {
				if file, err := os.Open(path); err != nil {
					return err
				} else {
					if _, err := io.Copy(writer, file); err != nil {
						file.Close()
						return err
					}
					file.Close()
				}
			}
			return nil
		} else {
			return err
		}
	})
	if err != nil {
		log.Println("zip:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("zip:", srcPath, " to ", dstPath, " success.")
	return pact.signPass
}

func (pact PostAction) arcTargz(srcPath, dstPath string) string {
	srcPath = strings.TrimRight(srcPath, "/\\")
	// assert srcPath exist
	if _, err := os.Stat(srcPath); err != nil {
		return pact.signFail
	}
	// assert dstPath not exist
	if _, err := os.Stat(dstPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	// create dstFile
	zipfile, err := os.Create(dstPath)
	if err != nil {
		zipfile.Close()
		log.Println("targz:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	gzipwriter := gzip.NewWriter(zipfile)
	tarwriter := tar.NewWriter(gzipwriter)
	defer zipfile.Close()
	defer gzipwriter.Close()
	defer tarwriter.Close()
	// for all (recursively) files under srcPath
	err = filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		header, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		header.Name = strings.TrimPrefix(path, filepath.Dir(srcPath)+"/")
		if err := tarwriter.WriteHeader(header); err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		if file, err := os.Open(path); err == nil {
			if _, err := io.Copy(tarwriter, file); err != nil {
				file.Close()
				return err
			}
			file.Close()
		} else {
			return err
		}
		return nil
	})
	if err != nil {
		log.Println("targz:", srcPath, " to ", dstPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("targz:", srcPath, " to ", dstPath, " success.")
	return pact.signPass
}

func (pact PostAction) uploadCheck(srcPath, fileMd5, chunksStr string) string {
	chunks, _ := strconv.Atoi(chunksStr)
	finishList := make([]string, 1)
	// check if file exist
	if _, err := os.Stat(srcPath); err == nil || os.IsExist(err) {
		finishList[0] = "exist"
	} else {
		finishList[0] = ""
	}
	// check what is finished
	for i := 0; i < chunks; i++ {
		fileNum := strconv.FormatInt(int64(i), 10)
		chunkPath := srcPath + "_" + fileMd5 + "/" + fileNum + ".tmp"
		if _, err := os.Stat(chunkPath); err == nil || os.IsExist(err) {
			finishList = append(finishList, fileNum)
		}
	}
	bytes, _ := json.Marshal(finishList)
	return string(bytes)
}

func (pact PostAction) uploadChunk(srcPath, fileMd5, currentStr string, content []byte) string {
	chunkPath := srcPath + "_" + fileMd5 + "/" + currentStr + ".tmp"
	// check or make dir
	if _, err := os.Stat(srcPath + "_" + fileMd5); !(err == nil || os.IsExist(err)) {
		if err := os.MkdirAll(srcPath+"_"+fileMd5, os.ModePerm); err != nil {
			log.Println("chunk:", chunkPath, " error: ", err.Error())
			return pact.signFail
		}
	}
	// assert chunckPath not exist
	if _, err := os.Stat(chunkPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	// write to chunckPath
	if err := ioutil.WriteFile(chunkPath, content, 0644); err != nil {
		log.Println("chunk:", chunkPath, " error: ", err.Error())
		return pact.signFail
	}
	log.Println("chunk:", chunkPath, " success.")
	return pact.signPass
}

func (pact PostAction) uploadMerge(srcPath, fileMd5, chunksStr string) string {
	chunks, _ := strconv.Atoi(chunksStr)
	// assert srcPath not exist
	if _, err := os.Stat(srcPath); err == nil || os.IsExist(err) {
		return pact.signExist
	}
	// create and open outFile
	outFile, err := os.OpenFile(srcPath, os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		outFile.Close()
		log.Println("merge:", srcPath, " error: ", err.Error())
		return pact.signFail
	}
	// write to openfile from inFile
	for i := 0; i < chunks; i++ {
		chunkPath := srcPath + "_" + fileMd5 + "/" + strconv.FormatInt(int64(i), 10) + ".tmp"
		inFile, err := os.OpenFile(chunkPath, os.O_RDONLY, os.ModePerm)
		if err != nil {
			inFile.Close()
			log.Println("merge:", srcPath, " error: ", err.Error())
			return pact.signFail
		}
		buf, err := ioutil.ReadAll(inFile)
		if err != nil {
			inFile.Close()
			log.Println("merge:", srcPath, " error: ", err.Error())
			return pact.signFail
		}
		outFile.Write(buf)
		inFile.Close()
		// do not remove chunks here!
	}
	// remove inFiles
	os.RemoveAll(srcPath + "_" + fileMd5)
	outFile.Close()
	log.Println("merge:", srcPath, " success.")
	return pact.signPass
}

func (pact PostAction) Call(genPath func(string) string, Response http.ResponseWriter, Request *http.Request) bool {
	query, _ := url.ParseQuery(Request.URL.RawQuery)
	method := strings.Join(query["method"], "")
	srcPath := genPath(Request.URL.Path)
	dstPath := genPath(strings.Join(query["destpath"], ""))
	result := ""
	switch method {
	case "mkdir":
		result = pact.mkdir(srcPath)
	case "mkfile":
		Request.ParseMultipartForm(int64(pact.maxFormMem))
		formFile := Request.MultipartForm.File["file"][0]
		file, _ := formFile.Open()
		buffer, _ := ioutil.ReadAll(file)
		result = pact.mkfile(srcPath, buffer)
	case "remove":
		result = pact.remove(srcPath)
	case "rename":
		result = pact.rename(srcPath, dstPath)
	case "copyto":
		result = pact.copyto(srcPath, dstPath)
	case "archive":
		format := strings.Join(query["format"], "")
		if format == "targz" {
			result = pact.arcTargz(srcPath, dstPath)
		} else {
			result = pact.arcZip(srcPath, dstPath)
		}
	case "check":
		fileMd5 := strings.Join(query["fileMd5"], "")
		chunks := strings.Join(query["chunks"], "")
		result = pact.uploadCheck(srcPath, fileMd5, chunks)
	case "chunk":
		fileMd5 := strings.Join(query["fileMd5"], "")
		currentChunk := strings.Join(query["currentChunk"], "")
		Request.ParseMultipartForm(int64(pact.maxFormMem))
		formFile := Request.MultipartForm.File[currentChunk][0]
		file, _ := formFile.Open()
		buffer, _ := ioutil.ReadAll(file)
		result = pact.uploadChunk(srcPath, fileMd5, currentChunk, buffer)
	case "merge":
		fileMd5 := strings.Join(query["fileMd5"], "")
		chunks := strings.Join(query["chunks"], "")
		result = pact.uploadMerge(srcPath, fileMd5, chunks)
	default:
		return false
	}
	fmt.Fprintln(Response, result)
	return true
}

// ======= Monitor ======== //

type Monitor struct {
	cTime, minAskTime int64
	info              string
}

func NewMonitor(ins map[string]interface{}) interface{} {
	instance := Monitor{
		cTime:      0,
		minAskTime: 3,
	}
	return &instance
}

func (moni Monitor) splitStr(str string, sep string) []string {
	// splitStr("12  34    56    ", " ") return {12,34,56}
	// func (str string) split(sep string) []string  is not allowed
	// return strings.Split(str, sep) // it would return many "" strings
	result := []string{}
	for {
		str = strings.Trim(str, sep) // delete sep before and after string
		if str == "" {
			break
		}
		// pos can not be 0 or len(str), cuz trim
		if pos := strings.Index(str, sep); pos == -1 {
			result = append(result, str)
			break
		} else {
			result = append(result, str[0:pos])
			str = str[pos:]
		}
	}
	return result
}

func (moni Monitor) getCpu() string {
	type cpuInfoType struct {
		Name, Core, Loadavg, Temperature, Idles, Totals string
	}
	var cpuInfo cpuInfoType
	if results, err := ioutil.ReadFile("/sys/class/thermal/thermal_zone0/temp"); err == nil {
		temp, _ := strconv.Atoi(string(results))
		cpuInfo.Temperature = strconv.FormatInt(int64(temp/1000), 10)
	}
	if results, err := ioutil.ReadFile("/proc/loadavg"); err == nil {
		load := moni.splitStr(string(results), " ")
		cpuInfo.Loadavg = load[0] + " " + load[1] + " " + load[2]
	}
	if results, err := ioutil.ReadFile("/proc/cpuinfo"); err == nil {
		info := moni.splitStr(string(results), "\n")
		cpuName := ""
		cpuCore := 0
		for _, item := range info {
			if strings.Index(item, "model name") == 0 {
				tmp := strings.Trim(item[strings.Index(item, ":")+1:], " ")
				cpuCore += 1
				if !strings.Contains(cpuName, tmp) {
					if cpuName != "" {
						cpuName += " | "
					}
					cpuName += tmp
				}
			}
		}
		cpuInfo.Name = cpuName
		cpuInfo.Core = strconv.FormatInt(int64(cpuCore), 10)
	}
	if results, err := ioutil.ReadFile("/proc/stat"); err == nil {
		var tmpTotals, tmpIdles []string
		info := moni.splitStr(string(results), "\n")
		for i := 0; i < len(info); i++ {
			if !strings.Contains(info[i], "cpu") {
				break
			}
			// cpu, cpu0, cpu1, ...
			tmp := info[i][strings.Index(info[i], " "):len(info[i])]
			tmpInfo := moni.splitStr(strings.Trim(tmp, " "), " ")
			tmpTotal := int64(0)
			tmpIdles = append(tmpIdles, tmpInfo[3])
			for i := 0; i < len(tmpInfo); i++ {
				tmpItem, _ := strconv.Atoi(tmpInfo[i])
				tmpTotal += int64(tmpItem)
			}
			tmpTotals = append(tmpTotals, strconv.FormatInt(tmpTotal, 10))
		}
		bytesidle, _ := json.Marshal(tmpIdles)
		bytestotal, _ := json.Marshal(tmpTotals)
		cpuInfo.Idles = string(bytesidle)
		cpuInfo.Totals = string(bytestotal)
	}
	bytes, _ := json.Marshal(cpuInfo)
	return string(bytes)
}

func (moni Monitor) getMem() string {
	type memInfoType struct {
		MemTotal, MemFree, Cached, Buffers, SwapTotal, SwapFree, SwapCached string
	}
	var memInfo memInfoType
	if results, err := ioutil.ReadFile("/proc/meminfo"); err == nil {
		info := moni.splitStr(string(results), "\n")
		for i := 0; i < len(info); i++ {
			tmpInfo := info[i]
			if strings.Index(tmpInfo, "MemTotal") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.MemTotal = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
			if strings.Index(tmpInfo, "MemFree") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.MemFree = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
			if strings.Index(tmpInfo, "Cached") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.Cached = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
			if strings.Index(tmpInfo, "Buffers") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.Buffers = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
			if strings.Index(tmpInfo, "SwapTotal") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.SwapTotal = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
			if strings.Index(tmpInfo, "SwapFree") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.SwapFree = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
			if strings.Index(tmpInfo, "SwapCached") == 0 {
				tmp := strings.Trim(tmpInfo[strings.Index(tmpInfo, ":")+1:], " ")
				memInfo.SwapCached = strings.Trim(tmp[0:strings.Index(tmp, " ")], " ")
			}
		}
	}
	bytes, _ := json.Marshal(memInfo)
	return string(bytes)
}

func (moni Monitor) getDisk() string {
	type diskInfoType struct {
		Usage, Detail string
	}
	var diskInfo diskInfoType
	stdout, _ := exec.Command("df", "-h").Output()
	diskInfo.Detail = string(stdout)
	info := moni.splitStr(diskInfo.Detail, "\n")
	for i := 0; i < len(info); i++ {
		tmp := strings.Trim(info[i], " ")
		if len(tmp) != 0 && strings.LastIndex(tmp, "/")+1 == len(tmp) {
			tmp = tmp[0:strings.LastIndex(tmp, "%")]
			diskInfo.Usage = tmp[strings.LastIndex(tmp, " ")+1:]
			break
		}
	}
	bytes, _ := json.Marshal(diskInfo)
	return string(bytes)
}

func (moni Monitor) getNet() string {
	type networkType struct {
		Dev, RxBytes, TxBytes string
	}
	var network []networkType
	if results, err := ioutil.ReadFile("/proc/net/dev"); err == nil {
		network = []networkType{}
		info := moni.splitStr(string(results), "\n")
		for i := 2; i < len(info); i++ {
			tmp := strings.Trim(info[i], " ")
			if tmp != "" {
				tmpArr := moni.splitStr(tmp, " ")
				network = append(network, networkType{tmpArr[0][0 : len(tmpArr[0])-1], tmpArr[1], tmpArr[9]})
			}
		}
	}
	bytes, _ := json.Marshal(network)
	return string(bytes)
}

func (moni Monitor) getUptime() string {
	uptime := ""
	if results, err := ioutil.ReadFile("/proc/uptime"); err == nil {
		info := strings.Trim(string(results), " ")
		info = moni.splitStr(info, " ")[0]
		info = info[0:strings.Index(info, ".")]
		time, _ := strconv.Atoi(info) // return 0 if error
		timeS := int64(float64(time) + 0.5)
		timeM := int64(float64(timeS) / 60)
		timeH := int64(float64(timeM) / 60)
		timeD := int64(float64(timeH) / 24)
		timeS = timeS - timeM*60
		timeM = timeM - timeH*60
		timeH = timeH - timeD*24
		uptime += strconv.FormatInt(timeD, 10) + "d " + strconv.FormatInt(timeH, 10) + "h "
		uptime += strconv.FormatInt(timeM, 10) + "m " + strconv.FormatInt(timeS, 10) + "s "
	}
	return uptime
}

func (moni Monitor) getDistro() string {
	distro := ""
	if results, err := ioutil.ReadFile("/etc/issue"); err == nil {
		distro = string(results)
		distro = distro[0:strings.Index(distro, "\\")]
	}
	return distro
}

func (moni Monitor) getHost() string {
	host := ""
	if result, err := os.Hostname(); err == nil {
		host = result
	}
	return host
}

func (moni Monitor) getVersion() string {
	version := ""
	if results, err := ioutil.ReadFile("/proc/version"); err == nil {
		version = string(results)
	}
	return version
}

func (moni Monitor) getInfo() string {
	type infoType struct {
		CpuInfo, MemInfo, DiskInfo, Network, Uptime, Distro, Host, Version string
	}
	var info infoType

	tTime := time.Now().Unix() // seconds
	if tTime-moni.cTime >= moni.minAskTime {
		moni.cTime = tTime
		info.CpuInfo = moni.getCpu()
		info.MemInfo = moni.getMem()
		info.DiskInfo = moni.getDisk()
		info.Network = moni.getNet()
		info.Uptime = moni.getUptime()
		info.Distro = moni.getDistro()
		info.Host = moni.getHost()
		info.Version = moni.getVersion()
		bytes, _ := json.Marshal(info)
		moni.info = string(bytes)
	}
	return moni.info
}

func (moni Monitor) Call(genPath func(string) string, Response http.ResponseWriter, Request *http.Request) bool {
	query, _ := url.ParseQuery(Request.URL.RawQuery)
	method := strings.Join(query["method"], "")
	switch method {
	case "monitor":
		fmt.Fprintln(Response, moni.getInfo())
	default:
		return false
	}
	return true
}
