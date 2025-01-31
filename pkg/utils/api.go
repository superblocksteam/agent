package utils

import (
	"encoding/json"
	"strings"

	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/observability"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func ApiType(api *apiv1.Api) string {
	if api == nil || api.Trigger == nil {
		return constants.ApiTypeUnknown
	}

	if api.Trigger.GetApplication() != nil {
		return constants.ApiTypeApi
	}

	if api.Trigger.GetJob() != nil {
		return constants.ApiTypeScheduledJob
	}

	if api.Trigger.GetWorkflow() != nil {
		return constants.ApiTypeWorkflow
	}

	return constants.ApiTypeUnknown
}

func ApiObservabilityFields(api *apiv1.Api) map[string]any {
	fields := map[string]any{
		observability.OBS_TAG_RESOURCE_TYPE: ApiType(api),
		observability.OBS_TAG_RESOURCE_NAME: api.GetMetadata().GetName(),
		observability.OBS_TAG_RESOURCE_ID:   api.GetMetadata().GetId(),
		observability.OBS_TAG_ORG_ID:        api.GetMetadata().GetOrganization(),
	}

	if application := api.Trigger.GetApplication(); application != nil {
		fields[observability.OBS_TAG_APPLICATION_ID] = application.Id
		fields[observability.OBS_TAG_PAGE_ID] = PointerDeref(application.PageId)
	}

	return fields
}

func ContainsSuperblocksSecrets(api *apiv1.Api, integrations map[string]*structpb.Struct) (bool, error) {
	return SearchAPI(api, integrations, "sb_secrets")
}

func SearchAPI(api *apiv1.Api, integrations map[string]*structpb.Struct, what ...string) (bool, error) {
	for _, obj := range []any{api, integrations} {
		data, err := json.Marshal(obj)
		if err != nil {
			return false, err
		}

		for _, w := range what {
			if strings.Contains(string(data), w) {
				return true, nil
			}
		}
	}

	return false, nil
}

func ForEachBlockInAPI(api *apiv1.Api, fn func(*apiv1.Block)) {
	ForEachBlockInAPIUntil(api, func(block *apiv1.Block) bool {
		fn(block)
		return false
	})
}

func ForEachBlockInAPIUntil(api *apiv1.Api, fn func(*apiv1.Block) bool) bool {
	for _, block := range api.GetBlocks() {
		if fn(block) {
			return true
		}

		if parallel := block.GetParallel(); parallel != nil {
			if static := parallel.GetStatic(); static != nil {
				for _, path := range static.Paths {
					ForEachBlockInAPIUntil(&apiv1.Api{Blocks: path.Blocks}, fn)
				}
			}
			if dynamic := parallel.GetDynamic(); dynamic != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: dynamic.Blocks}, fn)
			}
		}

		if conditional := block.GetConditional(); conditional != nil {
			if branchIf := conditional.GetIf(); branchIf != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: branchIf.Blocks}, fn)
			}

			for _, branch := range conditional.GetElseIf() {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: branch.Blocks}, fn)
			}

			if branchElse := conditional.GetElse(); branchElse != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: branchElse.Blocks}, fn)
			}
		}

		if loop := block.GetLoop(); loop != nil {
			ForEachBlockInAPIUntil(&apiv1.Api{Blocks: loop.Blocks}, fn)
		}

		if stream := block.GetStream(); stream != nil {
			if stream.Trigger != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: []*apiv1.Block{
					{
						Name: stream.Trigger.Name,
						Config: &apiv1.Block_Step{
							Step: stream.Trigger.Step,
						},
					},
				}}, fn)
			}

			if stream.Process != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: stream.Process.Blocks}, fn)
			}
		}

		if trycatch := block.GetTryCatch(); trycatch != nil {
			if try := trycatch.GetTry(); try != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: try.Blocks}, fn)
			}

			if catch := trycatch.GetCatch(); catch != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: catch.Blocks}, fn)
			}

			if finally := trycatch.GetFinally(); finally != nil {
				ForEachBlockInAPIUntil(&apiv1.Api{Blocks: finally.Blocks}, fn)
			}
		}
	}

	return false
}
