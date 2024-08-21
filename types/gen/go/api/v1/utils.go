package v1

import (
	"fmt"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
)

func (block *Block) Type() BlockType {
	if step := block.GetStep(); step != nil {
		return BlockType_BLOCK_TYPE_STEP
	}

	if wait := block.GetWait(); wait != nil {
		return BlockType_BLOCK_TYPE_WAIT
	}
	if rtn := block.GetReturn(); rtn != nil {
		return BlockType_BLOCK_TYPE_RETURN
	}
	if brk := block.GetBreak(); brk != nil {
		return BlockType_BLOCK_TYPE_BREAK
	}
	if conditional := block.GetConditional(); conditional != nil {
		return BlockType_BLOCK_TYPE_CONDITIONAL
	}
	if loop := block.GetLoop(); loop != nil {
		return BlockType_BLOCK_TYPE_LOOP
	}
	if parallel := block.GetParallel(); parallel != nil {
		return BlockType_BLOCK_TYPE_PARALLEL
	}
	if tryCatch := block.GetTryCatch(); tryCatch != nil {
		return BlockType_BLOCK_TYPE_TRYCATCH
	}
	if send := block.GetSend(); send != nil {
		return BlockType_BLOCK_TYPE_SEND
	}
	if stream := block.GetStream(); stream != nil {
		return BlockType_BLOCK_TYPE_STREAM
	}
	if variables := block.GetVariables(); variables != nil {
		return BlockType_BLOCK_TYPE_VARIABLES
	}
	if throw := block.GetThrow(); throw != nil {
		return BlockType_BLOCK_TYPE_THROW
	}

	return BlockType_BLOCK_TYPE_UNSPECIFIED
}

func (x *MetadataResponse_DatabaseSchemaMetadata) Minify() (any, error) {
	minified := &commonv1.SQLMetadata_Minified{
		Tables: make(map[string]*commonv1.SQLMetadata_Minified_Table),
	}

	for _, table := range x.Tables {
		minifiedTable := &commonv1.SQLMetadata_Minified_Table{
			Columns: make(map[string]string),
		}
		for _, column := range table.Columns {
			minifiedTable.Columns[column.Name] = column.Type
		}
		// Use table's fully qualified name (schema_name.table_name) as the key
		tableName := fmt.Sprintf("%s.%s", table.Schema, table.Name)
		minified.Tables[tableName] = minifiedTable
	}

	return minified, nil
}
