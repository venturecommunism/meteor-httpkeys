Package.describe({
  summary: "Http Keys CRUD"
});

Package.on_use(function (api, where) {
  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.add_files("collectionld.js", "server");
  api.export("CollectionLD", "server");
});
