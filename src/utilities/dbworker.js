const { MongoClient, ServerApiVersion } = require('mongodb');

class MongoWorker {
  constructor(uri, dbName) {
    this.uri = uri;
    this.dbName = dbName;
  }

  async insertOne(collectionName, data) {
    const client = new MongoClient(this.uri, { serverApi: ServerApiVersion.v1 });
    try {
      await client.connect();
      const database = client.db(this.dbName);
      const collection = database.collection(collectionName);
      const insertUser = await collection.insertOne(data);
      return insertUser.acknowledged;
    } 
    catch (error) {
      console.error(error);
    }
    finally {
      await client.close();
    }
  }

  async findOne(collectionName, query) {
    const client = new MongoClient(this.uri, { serverApi: ServerApiVersion.v1 });
    try {
      await client.connect();
      const database = client.db(this.dbName);
      const collection = database.collection(collectionName);
      const findUser = await collection.findOne(query);
      return findUser;
    } 
    catch (error) {
      console.error(error);
    }
    finally {
      await client.close();
    }
  }

  async updateOne(collectionName, query, data) {
    const client = new MongoClient(this.uri, { serverApi: ServerApiVersion.v1 });
    try {
      await client.connect();
      const database = client.db(this.dbName);
      const collection = database.collection(collectionName);
      const update = await collection.updateOne(query, { $set: data });
      return update.acknowledged;
    } 
    catch (error) {
      console.error(error);
    }
    finally {
      await client.close();
    }
  }
}

module.exports = { MongoWorker};