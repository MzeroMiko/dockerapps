package main

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"log"
)

func main() {
	backendURL, err := url.Parse("https://localhost:9090")
	if err != nil {
		log.Fatal("Error parsing backend URL:", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(backendURL)

	http.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
	
		r.URL.Path = r.URL.Path[len("/api/"):]
	
		proxy.ServeHTTP(w, r)
	})
	
	log.Println("Starting reverse proxy server on :7002...")
	if err := http.ListenAndServeTLS(":7002", nil); err != nil {
		log.Fatal("Error starting server:", err)
	}
}



