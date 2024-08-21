package validation

import (
	"fmt"

	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

type ValidateFunc func(*apiv1.Api) []error

// Validate performs dynamic validation on things that can't be validated with github.com/bufbuild/protoc-gen-validate.
// It is INCORRECT to place stuff here that can be validated with the aformentioned library.
func Validate(api *apiv1.Api, other ...ValidateFunc) (failures []error) {
	for _, rule := range append([]ValidateFunc{
		uniqueBlockNames,
		breakInValidScopes,
		// add your rules here
	}, other...) {
		failures = append(failures, rule(api)...)
	}

	return
}

func breakInValidScopes(api *apiv1.Api) (errors []error) {
	// TODO
	return nil
}

func uniqueBlockNames(api *apiv1.Api) (errors []error) {
	ledger := map[string]uint16{}

	utils.ForEachBlockInAPI(api, func(b *apiv1.Block) {
		if _, ok := ledger[b.Name]; !ok {
			ledger[b.Name] = 0
		}

		ledger[b.Name] = ledger[b.Name] + 1
	})

	for block, count := range ledger {
		if count < 2 {
			continue
		}

		errors = append(errors, fmt.Errorf("Block name %s is used %d times. Block names must be unique.", block, count))
	}

	return
}

func ValidateDefinition(def *apiv1.Definition) (failures []error) {
	return append(failures, Validate(def.GetApi())...)
}
