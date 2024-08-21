export const MongoDBPluginVersions = {
  V1: '0.0.1',
  V7: '0.0.7'
};

export enum MongoDBOperationType {
  aggregate = 'aggregate',
  count = 'count',
  deleteOne = 'deleteOne',
  deleteMany = 'deleteMany',
  distinct = 'distinct',
  find = 'find',
  findOne = 'findOne',
  insertOne = 'insertOne',
  insertMany = 'insertMany',
  listCollections = 'listCollections',
  replaceOne = 'replaceOne',
  updateOne = 'updateOne',
  updateMany = 'updateMany'
}
