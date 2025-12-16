package flagsclient

import (
	"github.com/superblocksteam/run"
)

//go:generate mockery --name=FlagsClient --output . --filename flags_client_mock.go --outpkg flagsclient --structname MockFlagsClient
type FlagsClient interface {
	run.Runnable

	GetBoolVariation(flag string, tier string, orgId string, fallback bool) bool
	GetBoolVariationByOrg(flag string, orgId string, fallback bool) bool
	GetBoolVariationCustomDims(flag string, orgId string, dims map[string]string, fallback bool) bool

	GetFloatVariation(flag string, tier string, orgId string, fallback float64) float64
	GetFloatVariationByOrg(flag string, orgId string, fallback float64) float64
	GetFloatVariationCustomDims(flag string, orgId string, dims map[string]string, fallback float64) float64

	GetIntVariation(flag string, tier string, orgId string, fallback int) int
	GetIntVariationByOrg(flag string, orgId string, fallback int) int
	GetIntVariationCustomDims(flag string, orgId string, dims map[string]string, fallback int) int

	GetStringVariation(flag string, tier string, orgId string, fallback string) string
	GetStringVariationByOrg(flag string, orgId string, fallback string) string
	GetStringVariationCustomDims(flag string, orgId string, dims map[string]string, fallback string) string

	GetStringSliceVariation(flag string, tier string, orgId string, fallback []string) []string
	GetStringSliceVariationByOrg(flag string, orgId string, fallback []string) []string
	GetStringSliceVariationCustomDims(flag string, orgId string, dims map[string]string, fallback []string) []string
}
