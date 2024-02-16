const express = require('express');
const app = express();
const port = 5000;
const { MongoClient } = require('mongodb');
require('dotenv').config()
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId;

app.use(express.json());
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${'siteFeatures'}:${'pm54H1J8cWYSKrVV'}@cluster0.x89oq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log('connected to db');
    const siteFeatures = client.db("SiteFeatures");
    const sitesCollection = siteFeatures.collection('sites');
    const pagesCollection = siteFeatures.collection('pages');
    const sectionsCollection = siteFeatures.collection('sections');
    const componentsCollection = siteFeatures.collection('components');
    const usersCollection = siteFeatures.collection('users')
    const historyCollection = siteFeatures.collection('history');

    // get sites
    app.get('/sites', async (req, res) => {
      const query = sitesCollection.find({})
      const result = await query.toArray();
      res.json(result)
    })

    // get pages
    app.get('/pages/:site', async (req, res) => {
      const siteValue = req.params.site;
      const result = await pagesCollection.find({ site: siteValue }).toArray()
      res.json(result)
    })

    // get pages options
    app.get('/pages-options/:site', async (req, res) => {
      const siteValue = req.params.site;
      const query = await pagesCollection.find({ site: siteValue }).toArray()
      const result = query.map(({ key, name }) => ({ key, name }));
      res.json(result)
    })

    // get sections options
    app.get('/sections-options/:site', async (req, res) => {
      const siteValue = req.params.site;
      const query = await sectionsCollection.find({ site: siteValue }).toArray()
      const result = query.map(({ key, name }) => ({ key, name }));
      res.json(result)
    })

    // get page sections
    app.get('/page-sections/:key', async (req, res) => {
      const keyValue = req.params.key;
      const page = await pagesCollection.findOne({ key: parseFloat(keyValue) });
      res.json(page)
    })

    // get section
    app.get('/getSection/:key', async (req, res) => {
      const keyValue = req.params.key;
      const result = await sectionsCollection.findOne({ key: parseFloat(keyValue) });
      res.json(result)
    })

    // get component options
    app.get('/component-options/:site', async (req, res) => {
      const siteValue = req.params.site;
      const query = await componentsCollection.find({ site: siteValue }).toArray()
      const result = query.map(({ key, name }) => ({ key, name }));
      res.json(result)
    })

    // get component
    app.get('/getComponent/:key', async (req, res) => {
      const keyValue = req.params.key;
      const result = await componentsCollection.findOne({ key: parseFloat(keyValue) });
      res.json(result)
    })

    // add pages
    app.post('/addPage', async (req, res) => {
      const page = req.body;
      console.log({ page })
      console.log(page.sections.map(({ key }) => parseFloat(key)))
      // push page into multiple section -> pages object
      const updatedDocument = await sectionsCollection.updateMany(
        { key: { $in: page.sections.map(({ key }) => parseFloat(key)) } },
        { $push: { pages: { name: page.name, key: parseFloat(page.key) } } }
      );
      console.log(updatedDocument)
      const result = await pagesCollection.insertOne(page);
      res.json(result)
    })

    // edit pages
    app.post('/editPage', async (req, res) => {
      const data = req.body;
      const editPageData = data.editPageData;
      const addedSections = data.addedSections;
      const removedSections = data.removedSections;
      console.log('editPageData', editPageData)
      console.log('addedSections', addedSections)
      console.log('removedSections', removedSections)
      const error = [];
      if (addedSections.length > 0) {
        const updatedAddedSections = await sectionsCollection.updateMany(
          { key: { $in: addedSections.map(({ key }) => parseFloat(key)) } },
          { $push: { pages: { name: editPageData.name, key: parseFloat(editPageData.key) } } }
        );
        console.log(updatedAddedSections)
        if (updatedAddedSections.modifiedCount != addedSections.length) {
          error.push({
            message: 'Failed to update associated sections for added section'
          });
        }
      }
      if (removedSections.length > 0) {
        const updatedRemovedSections = await sectionsCollection.updateMany(
          { key: { $in: removedSections.map(({ key }) => parseFloat(key)) } },
          { $pull: { pages: { name: editPageData.name, key: parseFloat(editPageData.key) } } }
        );
        console.log(updatedRemovedSections)
        console.log(updatedRemovedSections.modifiedCount)
        console.log(updatedRemovedSections.modifiedCount === removedSections.length)
        if (updatedRemovedSections.modifiedCount != removedSections.length) {
          error.push({
            message: 'Failed to update associated sections for removed section'
          });
        }
      }
      if (error.length > 0) {
        res.json(error)
      } else {
        const filter = { key: parseFloat(editPageData.key) }
        const updateDoc = { $set: editPageData }
        const option = { upsert: false }
        const result = await pagesCollection.updateOne(filter, updateDoc, option);
        console.log(result)
        res.json(result)
      }
    })

    // delete pages
    app.post('/deletePage', async (req, res) => {
      const data = req.body;
      console.log('delete data of', data)
      console.log('delete data of', data.sections)
      const updatedDocuments = await sectionsCollection.updateMany(
        { key: { $in: data.sections?.map(({ key }) => parseFloat(key)) } },
        { $pull: { pages: { name: data.name, key: parseFloat(data.key) } } }
      );
      // console.log(updatedDocuments)
      // if (updatedDocuments.modifiedCount != data.sections?.length) {
      //   res.status(500).send({
      //     message: 'Failed to delete associated sections'
      //   });
      // }
      const result = await pagesCollection.deleteOne({ key: parseFloat(data.key) });

      res.json({ result, updatedDocuments })
    })

    // add section
    app.post('/addSection', async (req, res) => {
      const section = req.body;
      console.log({ section })
      // push components into multiple section -> pages object
      const updatedDocument = await componentsCollection.updateMany(
        { key: { $in: section.components.map(({ key }) => parseFloat(key)) } },
        { $push: { sections: { name: section.name, key: parseFloat(section.key) } } }
      );

      // push page into multiple section -> pages object
      const updatedDocument2 = await pagesCollection.updateMany(
        { key: { $in: section.pages.map(({ key }) => parseFloat(key)) } },
        { $push: { sections: { name: section.name, key: parseFloat(section.key) } } }
      );
      console.log(updatedDocument)
      console.log(updatedDocument2)
      const result = await sectionsCollection.insertOne(section);
      res.json(result)
    })

    // delete section
    app.post('/deleteSection', async (req, res) => {
      const section = req.body;
      console.log('delete data of', section)
      const updatedDocuments = await componentsCollection.updateMany(
        { key: { $in: section.components?.map(({ key }) => parseFloat(key)) } },
        { $pull: { sections: { name: section.name, key: parseFloat(section.key) } } }
      );
      const updatedDocuments2 = await pagesCollection.updateMany(
        { key: { $in: section.pages?.map(({ key }) => parseFloat(key)) } },
        { $pull: { sections: { name: section.name, key: parseFloat(section.key) } } }
      );
      const updatedDocuments3 = await historyCollection.deleteMany({
        sectionKey: parseFloat(section.key)
      });
      console.log(updatedDocuments)
      console.log(updatedDocuments2)
      console.log(updatedDocuments3)
      // if (updatedDocuments.modifiedCount != section.components?.length) {
      //   res.status(500).send({ 
      //     message: 'Failed to delete associated sections'
      //   });
      // }
      const result = await sectionsCollection.deleteOne({ key: parseFloat(section.key) });
      res.json(result)
    })

    // edit section
    app.post('/editSection', async (req, res) => {
      const data = req.body;
      const editedSectionData = data.editedSectionData;
      const addedPages = data.addedPages;
      const removedPages = data.removedPages;
      const addedComponents = data.addedComponents;
      const removedComponents = data.removedComponents;
      console.log('editedSectionData', editedSectionData)
      console.log('addedComponents', addedComponents)
      console.log('removedComponents', removedComponents)
      const error = [];
      if (addedPages.length > 0) {
        const updatedAddedPages = await pagesCollection.updateMany(
          { key: { $in: addedPages.map(({ key }) => parseFloat(key)) } },
          { $push: { sections: { name: editedSectionData.name, key: parseFloat(editedSectionData.key) } } }
        );
        console.log(updatedAddedPages)
        if (updatedAddedPages.modifiedCount != addedPages.length) {
          error.push({
            message: 'Failed to update associated page for added page'
          });
        }
      }
      if (removedPages.length > 0) {
        const updatedRemovedPages = await pagesCollection.updateMany(
          { key: { $in: removedPages.map(({ key }) => parseFloat(key)) } },
          { $pull: { sections: { name: editedSectionData.name, key: parseFloat(editedSectionData.key) } } }
        );
        console.log(updatedRemovedPages)
        console.log(updatedRemovedPages.modifiedCount)
        console.log(updatedRemovedPages.modifiedCount === removedPages.length)
        if (updatedRemovedPages.modifiedCount != removedPages.length) {
          error.push({
            message: 'Failed to update associated page for removed page'
          });
        }
      }

      if (addedComponents.length > 0) {
        const updatedAddedComponents = await componentsCollection.updateMany(
          { key: { $in: addedComponents.map(({ key }) => parseFloat(key)) } },
          { $push: { sections: { name: editedSectionData.name, key: parseFloat(editedSectionData.key) } } }
        );
        console.log(updatedAddedComponents)
        if (updatedAddedComponents.modifiedCount != addedComponents.length) {
          error.push({
            message: 'Failed to update associated component for added component'
          });
        }
      }
      if (removedComponents.length > 0) {
        const updatedRemovedComponents = await componentsCollection.updateMany(
          { key: { $in: removedComponents.map(({ key }) => parseFloat(key)) } },
          { $pull: { sections: { name: editedSectionData.name, key: parseFloat(editedSectionData.key) } } }
        );
        console.log(updatedRemovedComponents)
        console.log(updatedRemovedComponents.modifiedCount)
        console.log(updatedRemovedComponents.modifiedCount === removedComponents.length)
        if (updatedRemovedComponents.modifiedCount != removedComponents.length) {
          error.push({
            message: 'Failed to update associated component for removed component'
          });
        }
      }
      if (error.length > 0) {
        res.json(error)
      } else {
        const filter = { key: parseFloat(editedSectionData.key) }
        const updateDoc = { $set: editedSectionData }
        const option = { upsert: false }
        const result = await sectionsCollection.updateOne(filter, updateDoc, option);
        console.log(result)
        res.json(result)
      }
    })

    // add component
    app.post('/addComponent', async (req, res) => {
      const component = req.body;
      console.log({ component })
      // push section into multiple section -> pages object
      const updatedDocument = await sectionsCollection.updateMany(
        { key: { $in: component.sections.map(({ key }) => parseFloat(key)) } },
        { $push: { components: { name: component.name, key: parseFloat(component.key) } } }
      );
      console.log(updatedDocument)
      const result = await componentsCollection.insertOne(component);
      res.json(result)
    })

    // delete component
    app.post('/deleteComponent', async (req, res) => {
      const component = req.body;
      console.log('delete data of', component)
      const updatedDocuments = await sectionsCollection.updateMany(
        { key: { $in: component.sections?.map(({ key }) => parseFloat(key)) } },
        { $pull: { components: { name: component.name, key: parseFloat(component.key) } } }
      );
      console.log(updatedDocuments)
      if (updatedDocuments.modifiedCount != component.sections?.length) {
        res.status(500).send({
          message: 'Failed to delete associated components'
        });
      }
      const result = await componentsCollection.deleteOne({ key: parseFloat(component.key) });
      res.json(result)
    })

    // edit component
    app.post('/editComponent', async (req, res) => {
      const data = req.body;
      const editComponentData = data.editComponentData;
      const addedSections = data.addedSections;
      const removedSections = data.removedSections;
      console.log('editComponentData', editComponentData)
      console.log('addedSections', addedSections)
      console.log('removedSections', removedSections)
      const error = [];
      if (addedSections.length > 0) {
        const updatedAddedSections = await sectionsCollection.updateMany(
          { key: { $in: addedSections.map(({ key }) => parseFloat(key)) } },
          { $push: { components: { name: editComponentData.name, key: parseFloat(editComponentData.key) } } }
        );
        console.log(updatedAddedSections)
        if (updatedAddedSections.modifiedCount != addedSections.length) {
          error.push({
            message: 'Failed to update associated components for added components'
          });
        }
      }
      if (removedSections.length > 0) {
        const updatedRemovedSections = await sectionsCollection.updateMany(
          { key: { $in: removedSections.map(({ key }) => parseFloat(key)) } },
          { $pull: { components: { name: editComponentData.name, key: parseFloat(editComponentData.key) } } }
        );
        console.log(updatedRemovedSections)
        console.log(updatedRemovedSections.modifiedCount)
        console.log(updatedRemovedSections.modifiedCount === removedSections.length)
        if (updatedRemovedSections.modifiedCount != removedSections.length) {
          error.push({
            message: 'Failed to update associated components for removed components'
          });
        }
      }
      if (error.length > 0) {
        res.json(error)
      } else {
        const filter = { key: parseFloat(editComponentData.key) }
        const updateDoc = { $set: editComponentData }
        const option = { upsert: false }
        const result = await componentsCollection.updateOne(filter, updateDoc, option);
        console.log(result)
        res.json(result)
      }
    })

    // save user
    app.post('/saveUser', async (req, res) => {
      const user = req.body;
      console.log(user)
      const existingData = await usersCollection.findOne({ email: user.email });
      if (existingData) {
        // if exist send existing user data to set role 
        res.json(existingData);
      } else {
        const result = await usersCollection.insertOne(user);
        res.json(result);
      }
    })

    // update user
    app.post('/updateRole', async (req, res) => {
      const data = req.body;
      const user = data.user;
      console.log(user);
      const role = data.role;
      const result = await usersCollection.updateOne(
        { email: user.email },
        { $set: { role: role } }
      );
      res.json(result);
    })

    // get all user
    app.get('/getAllUser', async (req, res) => {
      const query = usersCollection.find({})
      const result = await query.toArray();
      res.json(result)
    })

    // add history
    app.post('/addHistory', async (req, res) => {
      const history = req.body;
      console.log({ history })
      const result = await historyCollection.insertOne(history);
      res.json(result)
    })

    // get history
    app.get('/getHistory/:sectionKey', async (req, res) => {
      const sectionKey = req.params.sectionKey;
      const query = { sectionKey: parseFloat(sectionKey) }
      const result = await historyCollection.find(query).toArray();
      res.json(result);
    })

    // get all history by filter
    app.post('/getAllHistory', async (req, res) => {
      const filterData = req.body;
      console.log(filterData)
      if (false) {

      } else {
        const result = await historyCollection.find({}).toArray();
        res.json(result);
      }

      // const query = { sectionKey: parseFloat(sectionKey) }
      // const result = await historyCollection.find(query).toArray();
      // res.json(result);

      // const result = await productCollection.find()
      // .skip(page * size)
      // .limit(size)
      // .toArray();
      // res.send(result);
    })

  } finally {

  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('hello')
})


app.listen(port, () => {
  console.log('listening to port', port)
})