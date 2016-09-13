FROM dockercentos7_centos-base:latest
MAINTAINER Space Applications Services

# Install prepare infrastructure
RUN yum -y update && \
    yum -y install wget && \
    yum -y install tar && \
    yum -y install unzip && \
    yum -y install postgresql && \
    yum -y install nc && \
    yum -y install java-1.7.0-openjdk-headless

RUN yum clean all

# Prepare environment
ENV CATALINA_HOME /opt/tomcat
ENV PATH $PATH:$JAVA_HOME/bin:$CATALINA_HOME/bin:$CATALINA_HOME/scripts

ENV POSTGRES_HOST_NAME postgres

# Postgres credientals -> Overrriden by specific credientials per Strabon (see docker-compose)
ENV STRABON_PSQL_DB strabon_generic_db
ENV STRABON_PSQL_USER strabon_user
ENV STRABON_PSQL_PASS change_me

# Tomcat credientals
ENV STRABON_TOMCAT_USER  admin
ENV STRABON_TOMCAT_PASS  change_me


# Install Tomcat
RUN wget http://archive.apache.org/dist/tomcat/tomcat-7/v7.0.68/bin/apache-tomcat-7.0.68.tar.gz && \
    tar -xvf apache-tomcat-7.0.68.tar.gz && \
    rm apache-tomcat*.tar.gz && \
    mv apache-tomcat* ${CATALINA_HOME}

RUN chmod +x ${CATALINA_HOME}/bin/*sh

# Create Tomcat admin user
ADD create_admin_user.sh $CATALINA_HOME/scripts/create_admin_user.sh
#ADD tomcat.sh $CATALINA_HOME/scripts/tomcat.sh
RUN chmod +x $CATALINA_HOME/scripts/*.sh

# Add Strabon data ingestion script
ADD strabon.sh /scripts/strabon.sh
RUN chmod +x /scripts/strabon.sh

# Create tomcat user
RUN groupadd -r tomcat && \
    useradd -g tomcat -d ${CATALINA_HOME} -s /sbin/nologin  -c "Tomcat user" tomcat && \
    chown -R tomcat:tomcat ${CATALINA_HOME}

WORKDIR /opt/tomcat

EXPOSE 8080
EXPOSE 8009

# Add .war strabon snapshot
ADD http://maven.strabon.di.uoa.gr/service/local/repositories/releases/content/eu/earthobservatory/strabon-endpoint/3.3.1/strabon-endpoint-3.3.1.war /tmp/
RUN mv /tmp/strabon-endpoint-3.3.1.war /tmp/strabon.war

# Unzip and remove .war
RUN mkdir /opt/tomcat/webapps/strabon && \
    unzip /tmp/strabon.war -d /opt/tomcat/webapps/strabon && \
    rm /tmp/strabon.war

# Remove examples
RUN rm -r /opt/tomcat/webapps/examples

ADD ./my_init.d /etc/my_init.d/
ADD ./svc /etc/service/

CMD ["/sbin/my_init"]
