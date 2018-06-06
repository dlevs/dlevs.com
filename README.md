# dlevs.com

This is the repo for my personal portfolio site, [dlevs.com](https://dlevs.com). It is a [Node.js](https://nodejs.org/) app built using [the Koa framework](https://www.npmjs.com/package/koa).

The app is daemonised by [pm2](https://www.npmjs.com/package/pm2), and sits behind an [nginx](https://www.nginx.com/) reverse proxy which caches all requests. [instantclick](https://www.npmjs.com/package/instantclick) is used on the frontend to make things a little snappier for desktop users.

## First time setup

1. Install the Node.js version specified by [package.json](./package.json)'s `engine` property.
2. Install ffmpeg: `brew install ffmpeg --with-libvpx --with-libvorbis`.
3. Copy all media files not committed to this repository to `/publicSrc/processUncommitted`. This directory is for images, videos, etc, and is gitignored from repository due to filesize.
4. In the terminal, run:
    ```bash
    npm install                             # Install dependencies
    npm run build                           # Compile static assets (JS, CSS, image compression)
    cp config.sample.js config.js           # Create own config. Edit for environment.
    npm start                               # Start the app on port specified in config.js
    ```

### Other commands

| Command | Description |
| --- | --- |
| `npm start` | Run the app in production mode. |
| `npm run dev` | Run the app in development mode. Server restarts when assets change. |
| `npm run clean` | Remove files generated by the build. |
| `npm run build` | Compile static assets and compress images. |
| `npm run lint` | Lint files. Runs automatically on commit. |

## Directory structure

### Core app files

| Directory | Comments |
| --- | --- |
| `/routes` | Routes and controllers |
| `/views` | Templates (Pug) |
| `/lib` | Utility functions |

### Data

| Directory | Comments |
| --- | --- |
| `/data` | JSON files written by hand |
| `/data/generated` | JSON files generated by build scripts |

The site does not make use of any databases. Data to populate templates is stored in JSON files.

### Images
TODO: Change to "media"
| Directory | Comments |
| --- | --- |
| `/media` | Images organised into directories |

TODO: Update the below:
All images sit in the `/media` directory. They are copied by build tasks to `/public/media`.

During the process:

- SVGs get compressed via [svgo](https://www.npmjs.com/package/svgo).
- PNGs and JPGs get resized and compressed by [sharp](https://www.npmjs.com/package/sharp), and their metadata extracted.

For the PNGs and JPGs, multiple image files are outputted per source file. These have varying sizes and formats so that the most relevant may be used in a particular view.

Also, meta from each image is appended to a JSON file, containing:

- File paths of each of the output files
- Width
- Height
- Geolocation

The information stored in the JSON is used by pug mixins to serve the best-suited image. For example, Chrome users will see WEBP images, while other users will see JPG. Pug mixins will also apply padding based on [the padding-bottom hack](http://andyshora.com/css-image-container-padding-hack.html) to prevent page flicker due to reflow, and will apply lazy-load attributes where necessary.

### Frontend source files

| Directory | Comments |
| --- | --- |
| `/scripts` | Frontend scripts |
| `/styles` | Frontend styles (PostCSS) |

The scripts and styles in these directories are bundled into a single file for JS and another for CSS. They are used only on the client.

### Static files

| Directory | Comments |
| --- | --- |
| `/publicSrc` | Static files to serve from site root |
| `/public` | Static files to serve from site root that are generated by build |

### Build scripts

| Directory | Comments |
| --- | --- |
| `/build` | Scripts for compiling assets/ images |

All build scripts are initiated from `package.json`.

## Testing

### Overview

| Command | Description |
| --- | --- |
| `npm test` | Run unit tests. Includes all files ending with `.test.js`. |
| `npm run test:browser` | Run tests against a server. Includes all files ending with `.browsertest.js`. Needs some environment variables to be defined. |

### Browser tests

Some variables need to be passed to `npm run test:browser`:

| Command | Description |
| --- | --- |
| `env TEST_HOSTNAME=localhost:3000 npm run test:browser` | Run tests against localhost. |
| `env TEST_HOSTNAME=staging.dlevs.com TEST_USERNAME=foo TEST_PASSWORD=bar npm run test:browser` | Run  tests against staging. |
| `env TEST_HOSTNAME=dlevs.com npm run test:browser` | Run tests against production. |
| `env TEST_HOSTNAME=dlevs.com npm run test:browser -- sitemap` | Runs only tests with "sitemap" in the filename. |
| `env TEST_HOSTNAME=dlevs.com npm run test:browser -- --updateSnapshot` | Runs tests and updates the screenshots in `/tests/imageSnapshots/<HOSTNAME>`. Manually check these to ensure rendering is correct. All subsequent usages of `npm run test:browser` will compare the current UI to these screenshots, until running again with the `--updateSnapshot` flag. This can highlight UI regression. |
