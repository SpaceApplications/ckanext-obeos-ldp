FROM dockercentos7_centos-base:latest
#FROM ringo/scientific:6.5
MAINTAINER Space Applications Services

RUN yum -q -y update

# Install debug tools
RUN yum -y install \
        ack \
	tree

#
# # Install required packages
# gcc is usefull for pip packages compilation
RUN yum -y install \
        gcc \
        python-devel \
        python-pip \
        python-virtualenv \
        libxml2-devel \
        postgresql-devel \
        libxml2-devel \
        libxslt-devel \
        memcached \
        libmemcached \
        libmemcached-devel


# Install required packages
RUN yum -y install \
        httpd \
        mod_wsgi \
        git

# Install PIP
RUN yum -y install epel-release python-pip
RUN yum -y install supervisor

#
ENV HOME /root
ENV CKAN_HOME /usr/lib/ckan/default
ENV CKAN_CONFIG /etc/ckan/default
ENV CONFIG_FILE ckan.ini
ENV CONFIG_OPTIONS custom_options.ini
ENV CKAN_DATA /var/lib/ckan
ENV CKAN_INI $CKAN_CONFIG/$CONFIG_FILE
ENV SITE_URL obeos.spaceapplications.com
ENV PYTHON_EGGS_CACHE /usr/share/httpd/.python-eggs

# Create directories & virtual env for CKAN
RUN virtualenv $CKAN_HOME
RUN mkdir -p $CKAN_CONFIG $CKAN_DATA /var/log/ckan
# Note: CentOS uses 'apache' instead of 'www-data' user.
RUN chown apache:apache $CKAN_DATA

# copy CKAN and any extensions in the source target
ADD docker/ckan/pip_install_req.sh /usr/local/sbin/pip_install_req

# copy CKAN and any extensions in the source target
RUN git clone https://github.com/ckan/ckan.git $CKAN_HOME/src/ckan
RUN cd $CKAN_HOME/src/ckan && git checkout tags/ckan-2.5.2 && cd -
ADD _src/ $CKAN_HOME/src/
# RUN $CKAN_HOME/bin/pip install setuptools==18.5
RUN $CKAN_HOME/bin/pip install pip==1.4.1
RUN $CKAN_HOME/bin/pip install --upgrade html5lib==0.9999999
# install what we've just copied
RUN pip_install_req
RUN ln -s $CKAN_HOME/src/ckan/ckan/config/who.ini $CKAN_CONFIG/who.ini

# Copy any custom config
COPY _etc/ckan/ $CKAN_CONFIG/

# Make config file
RUN $CKAN_HOME/bin/paster make-config ckan ${CKAN_CONFIG}/${CONFIG_FILE}
# Replace site URL
RUN sed -e "s/#ckan.site_url/ckan.site_url/g"  $CKAN_INI
RUN sed -i -e '/ckan.site_url[[:space:]]\+=[[:space:]]\+/ s@= .*@= '"$SITE_URL"'@'   $CKAN_INI

# Configure OBEOS CKAN extensions
RUN tar xzvf $CKAN_HOME/src/ckanext-obeos.tar.gz  -C $CKAN_HOME/src/
RUN cd $CKAN_HOME/src/ckanext-obeos/ && $CKAN_HOME/bin/python setup.py develop
# # Install JS dependencies with Bower
RUN cd ~ && curl -O http://nodejs.org/dist/v0.10.30/node-v0.10.30-linux-x64.tar.gz
RUN tar --strip-components 1 -xzvf ~/node-v* -C /usr/local
# Git protocol replacement
RUN git config --global url."https://".insteadOf git://
RUN npm install -g bower
RUN cd $CKAN_HOME/src/ckanext-obeos/ckanext/rdfview/public/assets && bower install --allow-root --config.interactive=false
# # Configure Memcached
RUN mkdir -p /var/log/memcached/
RUN mkdir -p $PYTHON_EGGS_CACHE
RUN chown -R apache:apache $PYTHON_EGGS_CACHE


# Configure apache
RUN mkdir -p /etc/httpd/sites-available
RUN mkdir -p /etc/httpd/sites-enabled
RUN echo "IncludeOptional sites-enabled/*.conf" >> /etc/httpd/conf/httpd.conf
RUN echo "Listen 80" > /etc/httpd/ports.conf
COPY _etc/apache2/apache.wsgi $CKAN_CONFIG/apache.wsgi
COPY _etc/apache2/apache.conf /etc/httpd/sites-available/ckan_default.conf
RUN ln -sf /etc/httpd/sites-available/ckan_default.conf /etc/httpd/sites-enabled/ckan_default.conf

# Configure supervisor
COPY _etc/supervisor/conf.d/ /etc/supervisor/conf.d/

# Configure cron
COPY _etc/cron.d/ /etc/cron.d/
RUN chmod 600 -R /etc/cron.d/

## Set CKAN in Debug Mode (Disable this in a Production Environment !)
# RUN sed -i -e "s/# WSGIDaemonProcess/WSGIDaemonProcess/g" /etc/httpd/sites-enabled/ckan_default.conf
# RUN sed -i -e "s/# WSGIProcessGroup/WSGIProcessGroup/g" /etc/httpd/sites-enabled/ckan_default.conf
# RUN sed -i -e "s/debug = false/debug = true/g" /etc/ckan/default/ckan.ini


# # Configure runit
ADD docker/ckan/my_init.d/ /etc/my_init.d/
ADD docker/ckan/svc/ /etc/service/

# copy the config file for the plugin
ENV OBEOS_PLUGIN_CONFIG $CKAN_HOME/src/ckanext-obeos/ckanext/obeos/obeos_config.json
RUN rm $OBEOS_PLUGIN_CONFIG
ADD config/obeos_config.json $CKAN_HOME/src/ckanext-obeos/ckanext/obeos/

CMD ["/sbin/my_init"]

VOLUME ["/usr/lib/ckan", "/var/lib/ckan", "/etc/ckan"]
EXPOSE 80

RUN yum clean headers && yum clean packages  && rm -rf /var/lib/yum/yumdb/* /tmp/* /var/tmp/*

# Disable SSH
#RUN rm -rf /etc/service/sshd /etc/my_init.d/00_regen_ssh_host_keys.sh
