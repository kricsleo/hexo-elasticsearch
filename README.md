# hexo-elasticsearch

`hexo-elasticsearch` is a [hexo](https://hexo.io/) plugin help to synchronize your post to elasticsearch. You have to deploy your own elasticsearch server first before you start.

I mainly want to use elasticsearch for the searching of [my blog](https://kricsleo.com), so I made this plugin to synchronize my articles to the elasticsearch every time I make a change to the article, by using `hexo g` or `hexo s`

## Installation

```js
npm i -S hexo-elasticsearch
```

## usage

Configuring your elasticsearch info in `_config.yml`

```yml
elasticsearch:
  # your elasticsearch host, default: 127.0.0.1
  host: 127.0.0.1
  # your elasticsearch port, default: 9200
  port: 9200
  # the index to save your articles, default: blog
  index: blog
  # the type in the index to save your articles, default: article
  type: article
  # timeout when operating elasticsearch, default: 30000
  timeout: 30000
  # date format for formating post date and update date, default: YYYY-MM-DD, like: 2019-05-08
  dateFormat: YYYY-MM-DD
```

After configuring your elasticsearch info, every time you run `hexo g` or `hexo s`, your posts will be synchronized to your elasticsearch.

At this moment, I've just use serveral fields: `title`, `subtitle`, `author`, 'create_date', `update_date`, `link`, `text`

