//go:generate ogen --target ./ogen -package ogen --clean ../../openapi/openapi.json
package rest

import (
	"context"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest/ogen"
)

var _ ogen.Handler = &Handler{}

type Handler struct {
	service *Service
}

/*
	REST version of the JSON-RPC interface
*/

func transformInternalDownloadRequest(req *ogen.DownloadRequest) internal.DownloadRequest {
	var iReq internal.DownloadRequest
	if req.URL.Set {
		iReq.URL = req.URL.Value.String()
	}

	if req.Path.Set {
		iReq.Path = req.Path.Value
	}

	if req.Rename.Set {
		iReq.Rename = req.Rename.Value
	}

	iReq.Params = req.Params

	return iReq
}

func (h *Handler) AddDownload(ctx context.Context, req *ogen.DownloadRequest) (ogen.AddDownloadRes, error) {
	iReq := transformInternalDownloadRequest(req)

	id, err := h.service.Exec(iReq)
	if err != nil {
		return nil, err
	}

	res := ogen.AddDownloadOKApplicationJSON(id)
	return &res, nil
}

func (h *Handler) AddDownloadPlaylist(ctx context.Context, req *ogen.DownloadRequest) (ogen.AddDownloadPlaylistRes, error) {
	iReq := transformInternalDownloadRequest(req)

	if err := h.service.ExecPlaylist(iReq); err != nil {
		return nil, err
	}

	ok := ogen.AddDownloadPlaylistOKOk
	return &ok, nil
}

func (h *Handler) AddDwonloadLivestream(ctx context.Context, req *ogen.DownloadRequest) (ogen.AddDwonloadLivestreamRes, error) {
	iReq := transformInternalDownloadRequest(req)

	h.service.ExecLivestream(iReq)

	ok := ogen.AddDwonloadLivestreamOKOk
	return &ok, nil
}

func (h *Handler) Running(ctx context.Context) (ogen.RunningRes, error) {
	iRes, err := h.service.Running(ctx)
	if err != nil {
		return nil, err
	}

	res := ogen.RunningOKApplicationJSON{}
	for _, r := range *iRes {
		res = append(res, ogen.ProcessResponse{
			Progress: ogen.DownloadProgress{
				ProcessStatus: r.Progress.Status,
				Percentage:    r.Progress.Percentage,
				Speed:         r.Progress.Speed,
				Eta:           r.Progress.ETA,
			},
			Info: ogen.DownloadInfo{
				URL:         r.Info.URL,
				Title:       r.Info.Title,
				Thumbnail:   r.Info.Thumbnail,
				Resolution:  r.Info.Resolution,
				Size:        int(r.Info.Size),
				Vcodec:      r.Info.VCodec,
				Acodec:      r.Info.ACodec,
				Extension:   r.Info.Extension,
				OriginalURL: r.Info.OriginalURL,
				CreatedAt:   r.Info.CreatedAt,
			},
			Output: ogen.DownloadOutput{
				Path:          r.Output.Path,
				Filename:      r.Output.Filename,
				SavedFilePath: r.Output.SavedFilePath,
			},
		})
	}

	return &res, nil
}

func (h *Handler) GetVersion(ctx context.Context) (*ogen.GetVersionResponse, error) {
	rpc, ytdlp, err := h.service.GetVersion(ctx)
	if err != nil {
		return nil, err
	}

	return &ogen.GetVersionResponse{
		RpcVersion:   rpc,
		YtdlpVersion: ytdlp,
	}, nil
}

func (h *Handler) GetCookies(ctx context.Context) (*ogen.SetCookiesRequest, error) {
	cookies, err := h.service.GetCookies(ctx)
	if err != nil {
		return nil, err
	}

	return &ogen.SetCookiesRequest{
		Cookies: string(cookies),
	}, nil
}

func (h *Handler) SetCookies(ctx context.Context, req *ogen.SetCookiesRequest) (ogen.SetCookiesRes, error) {
	if err := h.service.SetCookies(ctx, req.Cookies); err != nil {
		return nil, err
	}

	ok := ogen.SetCookiesOKOk
	return &ok, nil
}

func (h *Handler) DeleteCookies(ctx context.Context) (ogen.DeleteCookiesOK, error) {
	if err := h.service.SetCookies(ctx, ""); err != nil {
		return "", err
	}

	return ogen.DeleteCookiesOKOk, nil
}

func (h *Handler) AddTemplate(ctx context.Context, req *ogen.CustomTemplate) (ogen.AddTemplateRes, error) {
	var iReq internal.CustomTemplate
	iReq.Id = req.ID
	iReq.Name = req.Name
	iReq.Content = req.Content

	if err := h.service.SaveTemplate(ctx, &iReq); err != nil {
		return nil, err
	}

	ok := ogen.AddTemplateOKOk
	return &ok, nil
}

func (h *Handler) TemplateAllGet(ctx context.Context) ([]ogen.CustomTemplate, error) {
	templates, err := h.service.GetTemplates(ctx)
	if err != nil {
		return nil, err
	}

	res := []ogen.CustomTemplate{}
	for _, t := range *templates {
		res = append(res, ogen.CustomTemplate{
			ID:      t.Id,
			Name:    t.Name,
			Content: t.Content,
		})
	}

	return res, nil
}

func (h *Handler) TemplateIDDelete(ctx context.Context, params ogen.TemplateIDDeleteParams) (ogen.TemplateIDDeleteRes, error) {
	if err := h.service.DeleteTemplate(ctx, params.ID); err != nil {
		return nil, err
	}

	ok := ogen.TemplateIDDeleteOKOk
	return &ok, nil
}
