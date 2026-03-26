const sliderImageRoutePattern = /\.(png|jpg|jpeg)$/i;
const sliderImageRouteHandler = (route) => route.abort();

async function enableSliderImageBlocking(page) {
  await page.route(sliderImageRoutePattern, sliderImageRouteHandler).catch(() => {});
}

async function disableSliderImageBlocking(page) {
  await page.unroute(sliderImageRoutePattern, sliderImageRouteHandler).catch(() => {});
}

module.exports = {
  enableSliderImageBlocking,
  disableSliderImageBlocking
};
