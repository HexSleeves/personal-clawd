package utils

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("content-type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func ReadJSON(r *http.Request, dst interface{}, maxBytes int64) error {
	if r.Body == nil {
		return errors.New("missing request body")
	}
	defer r.Body.Close()

	dec := json.NewDecoder(io.LimitReader(r.Body, maxBytes))
	if err := dec.Decode(dst); err != nil {
		return err
	}
	return nil
}
