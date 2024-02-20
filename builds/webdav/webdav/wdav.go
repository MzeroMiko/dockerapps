package main

// go env -w GOPROXY=https://goproxy.cn && go env -w GO111MODULE=auto && go build --ldflags '-w -s' wdav.go && upx wdav 

import (
	"fmt"
	"log"
	"flag"
	"time"
	"os"
	"net"
	"net/http"
	"strings"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"math/big"
	"encoding/pem"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/webdav"
)

type sliceflag []string

func (f *sliceflag) String() string {
	return fmt.Sprintf("%v", []string(*f))
}

func (f *sliceflag) Set(value string) error {
	*f = append(*f, value)
	return nil
}

type User struct {
	Username, Password, Scope, Prefix string
	Modify bool
	Handler *webdav.Handler
}

type Config struct {
	Addr, Cert, Key	string
	TLS, Auth 		bool
	DefUser 	*User
	Users     	map[string]*User
}

type responseWriterNoBody struct {
	http.ResponseWriter
}

func newResponseWriterNoBody(w http.ResponseWriter) *responseWriterNoBody {
	return &responseWriterNoBody{w}
}

func (w responseWriterNoBody) Header() http.Header {
	return w.ResponseWriter.Header()
}

func (w responseWriterNoBody) Write(data []byte) (int, error) {
	return 0, nil
}

func (w responseWriterNoBody) WriteHeader(statusCode int) {
	w.ResponseWriter.WriteHeader(statusCode)
}

func (c *Config) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var user *User = nil
	username := "undefined"
	if c.Auth {
		w.Header().Set("WWW-Authenticate", "Basic realm=\"Restricted\"")
	}
	if username, password, ok := r.BasicAuth(); ok {
		if tmp, ok := c.Users[username]; ok {
			if c.Auth {
				pass := false
				if strings.HasPrefix(tmp.Password, "{bcrypt}") {
					pass = (bcrypt.CompareHashAndPassword([]byte(strings.TrimPrefix(tmp.Password, "{bcrypt}")), []byte(password)) == nil)
				} else {
					pass = (password == tmp.Password)
				}
				if pass {
					user = tmp
				}
			} else {
				user = tmp
			}
		}
	}
	if user == nil {
		if !c.Auth {
			user = c.DefUser
		} else {
			w.WriteHeader(http.StatusUnauthorized)
			log.Printf("user unauthorized: username: %s, remote: %s", username, r.RemoteAddr)
			return
		}
	}
	if allowed := (user.Modify || (r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" || r.Method == "PROPFIND") ); !allowed {
		w.WriteHeader(http.StatusForbidden)
		log.Printf("method forbidden: username: %s, method: %s, remote: %s", username, r.Method, r.RemoteAddr)
		return
	}
	if r.Method == "HEAD" {
		w = newResponseWriterNoBody(w)
	}
	if r.Method == "GET" && strings.HasPrefix(r.URL.Path, user.Handler.Prefix) {
		if info, err := user.Handler.FileSystem.Stat(context.TODO(), strings.TrimPrefix(r.URL.Path, user.Handler.Prefix)); err == nil && info.IsDir() {
			r.Method = "PROPFIND"
			if r.Header.Get("Depth") == "" {
				r.Header.Add("Depth", "1")
			}
		}
	}
	user.Handler.ServeHTTP(w, r)
}

func parseUser(defUser *User, strValue string) *User {
	var user *User = nil
	userSlice := strings.Split(strValue, ":")
	lenslice := len(userSlice)
	username := ""
	if lenslice > 0 {
		username = userSlice[0]
		user = &User{
			Username:username, Password:"", 
			Scope:defUser.Scope, Prefix:defUser.Prefix, Modify:defUser.Modify,
		}
	}
	if lenslice > 1 {
		user.Password = userSlice[1]
	}
	if lenslice > 2 && userSlice[2] != "" {
		user.Scope = userSlice[2]
	}
	if lenslice > 3 && userSlice[3] != ""{
		user.Prefix = userSlice[3]
	}
	if lenslice > 4 && (userSlice[4] == "true" || userSlice[4] == "True" || userSlice[4] == "TRUE") {
		user.Modify = true
	}
	if user != nil {
		user.Handler = &webdav.Handler{
			Prefix: user.Prefix,
			FileSystem: webdav.Dir(user.Scope),
			LockSystem: webdav.NewMemLS(),
		}
	}
	return user
}

func parseConfig() Config {
	// webdav --addr [::]:6001 --tls --cert "" --key "" \
	// --auth --dafault "scope:prefix:modify" --user "user:pass:scope:prefix:modify" --user "" ...
	var conf Config
	var flagUser sliceflag
	var defuser string
	conf.DefUser = &User{Username:"", Password:"", Scope:".", Prefix:"/", Modify:false, }
	conf.Users = make(map[string]*User)
	flag.StringVar(&(conf.Addr), "addr", "[::]:6000", "listen address")
	flag.BoolVar(&(conf.TLS), "tls", false, "enable https")
	flag.StringVar(&(conf.Cert), "cert", "simp.cert", "cert file if use https")
	flag.StringVar(&(conf.Key), "key", "simp.key", "key file if use https")
	flag.BoolVar(&(conf.Auth), "auth", false, "enable auth")
	flag.StringVar(&(defuser), "def", ".:/:false", "default user setting, scope:prefix:modify")
	flag.Var(&flagUser, "user", "add user config: --user \"user:pass:prefix:scope:modify\"")
	flag.Parse()

	if tmp := parseUser(conf.DefUser, "::" + defuser); tmp != nil {
		conf.DefUser = tmp
	}
	for _, value := range flagUser {
		if tmp := parseUser(conf.DefUser, value); tmp != nil && tmp.Username != "" {
			conf.Users[tmp.Username] = tmp;
		}
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
	addr := conf.Addr
	usetls := conf.TLS
	crtfile := conf.Cert
	keyfile := conf.Key

	// $0 --addr 4 --tls --auth --cert 3 -key 5 -def 2:3:4 -user 1:2:3:4:5 -user 1:2:3:4:true --user :::: --user 9:3:
	log.Printf("go webdav server ( pid : %d ) starts at \"%s\"\n", os.Getpid(), addr)
	log.Printf("config: %+v\n", conf)
	log.Printf("config.DefUser: %+v\n", conf.DefUser)
	for key, val := range conf.Users {
		log.Printf("config.Users: %+v: %+v\n", key, val)
	}

	http.HandleFunc("/", conf.ServeHTTP)

	if usetls {
		_, errCrt := os.Stat(crtfile)
		_, errKey := os.Stat(keyfile)
		if !(errCrt == nil || os.IsExist(errCrt)) || !(errKey == nil || os.IsExist(errKey)) {
			cert, key := genCert()
			pair, _ := tls.X509KeyPair(cert, key)
			srv := http.Server{
				Addr:    addr,
				Handler: nil,
				TLSConfig: &tls.Config{
					Certificates: []tls.Certificate{pair},
				},
			}
			if err := srv.ListenAndServeTLS("", ""); err != nil {
				panic("ListenAndServeTLS: " + err.Error())
			}
		} else {
			if err := http.ListenAndServeTLS(addr, crtfile, keyfile, nil); err != nil {
				panic("ListenAndServeTLS: " + err.Error())
			}
		}
	} else {
		if err := http.ListenAndServe(addr, nil); err != nil {
			panic("ListenAndServe: " + err.Error())
		}
	}
}
