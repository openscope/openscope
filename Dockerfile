FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install -g gulp-cli
RUN npm install

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 3003

CMD [ "npm", "start" ]