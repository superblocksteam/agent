package context

import (
	"context"
	"strings"
	"sync"

	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/protobuf/types/known/structpb"
)

// NOTE(frank): Move towards private fields.
type Context struct {
	blockPath            []string
	formPath             []string
	Execution            string
	Scope                string
	Parent               string
	Name                 string
	Type                 apiv1.BlockType
	ParentType           apiv1.BlockType
	Context              context.Context
	Parallels            utils.Map[chan struct{}]
	isDescendantOfStream bool
	RequestOptions       *apiv1.ExecuteRequest_Options

	// If we are inside of an active loop, this will represent the
	// name of the loop block that will will use to back out too.
	breakScope string
	options    *options.Options
	lineage    []string
	parents    []string
	mutex      *sync.RWMutex
	resolved   map[string]map[string]*apiv1.Resolved

	// NOTE(frank): We don't need get wrappers as this map is threadsafe.
	Variables utils.Map[*transportv1.Variable]

	MaxStreamSendSize    int
	MaxStreamTriggerSize int
	MaxParellelPoolSize  int
}

func New(ctx *Context) *Context {
	ctx.mutex = &sync.RWMutex{}
	ctx.parents = []string{"ROOT"}
	ctx.Variables = utils.NewMap[*transportv1.Variable]()
	ctx.Parallels = utils.NewMap[chan struct{}]()
	ctx.resolved = map[string]map[string]*apiv1.Resolved{}

	if ctx.RequestOptions == nil {
		ctx.RequestOptions = &apiv1.ExecuteRequest_Options{}
	}

	return ctx
}

// TODO(frank): We need to fully understand what this function is
// used for. We are not doing a merge and it can be very confusing.
func (c *Context) Merge(newCtx *Context) {
	c.Execution = newCtx.Execution
	c.Scope = newCtx.Execution
	c.Parent = newCtx.Parent
	c.ParentType = newCtx.ParentType
	c.Name = newCtx.Name
	c.Type = newCtx.Type
	c.options = newCtx.options
	c.lineage = newCtx.lineage
	c.parents = newCtx.parents
	c.mutex = newCtx.mutex
	c.Variables = newCtx.Variables
	// Since this is used for the next block, we need to ensure both are descendants of stream processes to
	// consider the current context a descendant of a stream process.
	c.isDescendantOfStream = c.IsDescendantOfStream() && newCtx.IsDescendantOfStream()
}

func (c *Context) Parents() []string {
	return c.parents
}

func (c *Context) WithOptions(ops *options.Options) *Context {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	(*c).options = ops
	return c
}

func (c *Context) ClearOptions() *Context {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	(*c).options = nil
	return c
}

func (c *Context) Options() *options.Options {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	if c.options != nil {
		return c.options
	}

	return new(options.Options)
}

func (c *Context) Resolve(path, _ string, value *structpb.Value, individual ...*structpb.Value) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.RequestOptions.GetIncludeResolved() {
		return
	}

	if _, ok := c.resolved[c.Name]; !ok {
		c.resolved[c.Name] = map[string]*apiv1.Resolved{}
	}

	c.resolved[c.Name][path] = &apiv1.Resolved{
		Value:    value,
		Bindings: individual,
	}
}

func (c *Context) GetResolved() map[string]*apiv1.Resolved {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	return c.resolved[c.Name]
}

func (old *Context) WithVariables(variables map[string]*transportv1.Variable) *Context {
	old.mutex.Lock()
	defer old.mutex.Unlock()

	new := *old

	new.Variables = old.Variables.Clone()

	for k, v := range variables {
		metrics.VariablesTotal.WithLabelValues(v.Type.String()).Inc()
		new.Variables.Put(k, v)
	}

	return &new
}

// Loop returns the name of the loop enclosing this context.
func (c *Context) Loop() string {
	return c.breakScope
}

// TODO(frank): This method needs more unit tests.
func (c *Context) Sink(lineage string) *Context {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	new := *c

	(&new).resolved = map[string]map[string]*apiv1.Resolved{}

	(&new).lineage = make([]string, len(c.lineage))
	copy((&new).lineage, c.lineage)

	(&new).parents = make([]string, len(c.parents))
	copy((&new).parents, c.parents)

	(&new).lineage = append((&new).lineage, c.Name)
	(&new).parents = append((&new).parents, c.Name)

	if lineage != "" {
		(&new).lineage = append((&new).lineage, lineage)
	}

	if c.Type == apiv1.BlockType_BLOCK_TYPE_LOOP {
		(&new).breakScope = c.Name
	}
	if c.IsDescendantOfStream() {
		(&new).isDescendantOfStream = true
	}

	(&new).Parent = c.Name
	(&new).ParentType = c.Type
	(&new).Name = ""
	(&new).Variables = c.Variables.Clone()
	(&new).blockPath = c.blockPath
	(&new).formPath = c.formPath
	(&new).Parallels = c.Parallels.Clone()

	return &new
}

func (c *Context) Advance(name string) *Context {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	new := *c
	(&new).Name = name

	new.blockPath = append(c.blockPath, name)
	return &new
}

func (c *Context) BlockPath() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return strings.Join(c.blockPath, ".")
}

func (c *Context) AppendFormPath(paths ...string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.formPath = append(c.formPath, paths...)
}

func (c *Context) FormPath() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return strings.Join(c.formPath, ".")
}

func (c *Context) Fields(definitionMetadata *apiv1.Definition_Metadata, more ...zapcore.Field) []zapcore.Field {
	fields := []zapcore.Field{
		zap.String(observability.OBS_TAG_RESOURCE_NAME, c.Name),
		zap.String(observability.OBS_TAG_RESOURCE_TYPE, c.Type.String()),
	}

	if c.ParentType != apiv1.BlockType_BLOCK_TYPE_UNSPECIFIED {
		fields = append(fields,
			zap.String(observability.OBS_TAG_PARENT_NAME, c.Parent),
			zap.String(observability.OBS_TAG_PARENT_TYPE, c.ParentType.String()),
		)
	}

	fields = append(fields, observability.EnrichUserInfo(c.Context, definitionMetadata)...)

	return append(fields, more...)
}

func (c *Context) ReferencedVariables(actionCfg string) map[string]*transportv1.Variable {
	referencedVariables := map[string]*transportv1.Variable{}
	for name, variable := range c.Variables.ToGoMap() {
		if strings.Contains(actionCfg, name) {
			referencedVariables[name] = variable
		}
	}
	return referencedVariables
}

func (c *Context) IsDescendantOfStream() bool {
	return c.Type == apiv1.BlockType_BLOCK_TYPE_STREAM || c.isDescendantOfStream
}
