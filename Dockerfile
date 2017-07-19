FROM mhart/alpine-node:6

VOLUME /opt/app/run

ARG CUPD_VERSION
ENV CUPD_VERSION=${CUPD_VERSION:-"1.0.0"}

LABEL syngularity.docker.updater \
      syngularity.docker.updater.version=${CUPD_VERSION}

WORKDIR /opt/app
COPY . ./
RUN npm i --production=false --quiet


CMD npm start
