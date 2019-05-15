const util = require('hexo-util');
const moment = require('moment');
const es = require('elasticsearch');

const minify = str => util.stripHTML(str).trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

const config = Object.assign({
  host: '127.0.0.1',
  port: 9200,
  timeout: 30000,
  index: 'blog',
  type: 'article',
  dateFormat: 'YYYY-MM-DD',
  // log: 'trace'
}, hexo.config.elasticsearch || {});

const address = `${config.host}:${config.port}`;

const client = new es.Client({
  host: address
});

const generatorDocsByPosts = posts => posts.map(post => ({
  title: post.title,
  subtitle: post.subtitle,
  author: post.author,
  create_date: moment(post.date).format(config.dateFormat),
  update_date: moment(post.updated).format(config.dateFormat),
  path: post.path,
  link: post.permalink,
  content: minify(post.content),
}));

const clearPrevDocs = (index, type) => client.deleteByQuery({
  index,
  type,
  body: {
    query: {
      match_all: {}
    }
  }
})

const generatorIndexDSL = (index, type, docs) => {
  const bulk = [];
  docs.map(doc => {
    bulk.push({
      index: {
        _index: index,
        _type: type,
      }
    });
    bulk.push(doc);
  });
  return {body: bulk};
}

const mapping = (index, type) => client.indices.exists({
  index,
}).then(isIndexExist => {
  if (isIndexExist) {
    return client.indices.existsType({
      index,
      type
    }).then(isTypeExist => isTypeExist ? null : putMapping(index, type));
  } else {
    return client.indices.create({
      index
    }).then(() => putMapping(index, type));
  }
})

const putMapping = (index, type) =>
  client.indices.putMapping({
    index,
    type,
    body: {
      properties: {
        title: {
          type: 'text',
          term_vector: 'with_positions_offsets',
          analyzer: 'ik_max_word',
          search_analyzer: 'ik_max_word'
        },
        subtitle: {
          type: 'text',
          term_vector: 'with_positions_offsets',
          analyzer: 'ik_max_word',
          search_analyzer: 'ik_max_word'
        },
        content: {
          type: 'text',
          term_vector: 'with_positions_offsets',
          analyzer: 'ik_max_word',
          search_analyzer: 'ik_max_word'
        },
        path: {
          type: 'keyword'
        },
        link: {
          type: 'keyword'
        },
        author: {
          type: 'keyword',
        },
        categories: {
          type: 'keyword',
        },
        tags: {
          type: 'keyword',
        },
        create_date: {
          type: 'date',
        },
        update_date: {
          type: 'date',
        }
      }
    }
  })

const insertDocs = (index, type, docs) => 
  client.bulk(generatorIndexDSL(index, type, docs))
    .then(res => {
      let errorCount = 0;
      res.items.forEach(item => {
        if (item.index && item.index.error) {
          console.error('\033[31mElasticsearch: \033[0m', `${errorCount++} synchronize failed \n ${item.index.error}`);
        }
      });

      const total = res.items.length;
      console.log('\033[32mElasticsearch: \033[0m', `synchronize done, ${total - errorCount}/${total} synchronized successfully!`);
    })

hexo.extend.generator.register('elasticsearch', site => {
  client.ping({
    requestTimeout: config.timeout
  }).then(() => mapping(config.index, config.type))
    .then(() => clearPrevDocs(config.index, config.type))
    .then(res => {
      console.log('\033[32mElasticsearch: \033[0m', `delete previous articles done, ${res.deleted}/${res.total} delete successfully!`);
      
      return insertDocs(config.index, config.type, generatorDocsByPosts(site.posts));
    })
    .catch(err => console.error('\033[31mElasticsearch: \033[0m', `synchronizing articles failed \n ${err}`))
})