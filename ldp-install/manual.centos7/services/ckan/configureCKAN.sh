#!/bin/sh
set -eu

CONFIG="${CKAN_CONFIG}/${CONFIG_FILE}"

abort () {
  echo "$@" >&2
  exit 1
}

write_config () {
  # update the config dynamic urls
  echo "Configuring dynamic URLs"
  "$CKAN_HOME"/bin/paster --plugin=ckan config-tool "$CONFIG" -e \
      "ckan.site_url            = http://$(hostname -f)" \
      "sqlalchemy.url           = ${DATABASE_URL}" \
      "solr_url                 = ${SOLR_URL}" \
      "ckan.datastore.write_url = ${DATASTORE_WRITE_URL}" \
      "ckan.datastore.read_url  = ${DATASTORE_READ_URL}"

  # apply any custom options
  if [ -e "$CKAN_CONFIG/$CONFIG_OPTIONS" ]; then
    echo "Configuring custom options from $CONFIG_OPTIONS"
    "$CKAN_HOME"/bin/paster --plugin=ckan config-tool "$CONFIG" -f "$CKAN_CONFIG/$CONFIG_OPTIONS"
  fi
}

link_postgres_url () {
  local user=$CKAN_USER
  local pass=$CKAN_PASS
  local db=$CKAN_DBPG
  local host=localhost
  local port=5432
  echo "postgresql://${user}:${pass}@${host}:${port}/${db}"
}

link_datastore_write_url () {
  local user=$CKAN_USER
  local pass=$CKAN_PASS
  local db=$DATASTORE_DB
  local host=localhost
  local port=5432
  echo "postgresql://${user}:${pass}@${host}:${port}/${db}"
}

link_datastore_read_url () {
  local user=$DATASTORE_USER
  local pass=$DATASTORE_PASS
  local db=$DATASTORE_DB
  local host=localhost
  local port=5432
  echo "postgresql://${user}:${pass}@${host}:${port}/${db}"
}

link_solr_url () {
  local host=localhost
  local port=8983
  echo "http://${host}:${port}/solr/ckan"
}

# install any extensions in the source directory
# this is required if you mount a volume as a source directory
cd $CKAN_HOME/src/
for module in *
do
  if [ -d "$module" ]; then
    cd $module
    if [ -e "setup.py" ]; then
      echo ">>> Installing $module"
      $CKAN_HOME/bin/pip install -e .
    fi
    cd ..
  fi
done

# If we don't already have a who.ini symlink create it
if [ ! -e "$CKAN_CONFIG/who.ini" ]; then
  echo "WARNING: my_init had to symlink who.ini again, please check that your volumes are set-up correctly"
  ln -s $CKAN_HOME/src/ckan/ckan/config/who.ini $CKAN_CONFIG/who.ini
fi

# If we don't already have a config file, bootstrap
if [ ! -e "$CONFIG" ]; then
  echo "WARNING: my_init had to create a config again, please check that your volumes are set-up correctly"
  $CKAN_HOME/bin/paster make-config ckan "$CONFIG"
fi

# Create the options in SQLAlchemy format
DATABASE_URL=$(link_postgres_url);
DATASTORE_WRITE_URL=$(link_datastore_write_url);
DATASTORE_READ_URL=$(link_datastore_read_url);
SOLR_URL=$(link_solr_url);

# update the config
write_config

# run the init script in case the database need to be upgraded
"$CKAN_HOME"/bin/paster --plugin=ckan db init -c "${CKAN_CONFIG}/ckan.ini"
