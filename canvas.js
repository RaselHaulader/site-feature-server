// const setPagination = (currentPage, totalItems) => {
//   const itemsPerPage = 1;
//   const maxPaginationLinks = 3;
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   let startPage = Math.max(1, currentPage - Math.floor(maxPaginationLinks / 2));
//   let endPage = Math.min(totalPages, startPage + maxPaginationLinks - 1);

//   if (endPage - startPage + 1 < maxPaginationLinks) {
//     startPage = Math.max(1, endPage - maxPaginationLinks + 1);
//   }
//   const paginationArray = [];
//   for (let page = startPage; page <= endPage; page++) {
//     paginationArray.push(page);
//   }
//   if ((1 < currentPage - 1 || currentPage === 3) && totalPages > 3) {
//     paginationArray.unshift(1)
//   }
//   if (totalPages > paginationArray[paginationArray.length - 1]) {
//     paginationArray.push(totalPages)
//   }
//   console.log({ paginationArray })
// }

// // Example usage:
// const currentPage = 4;
// const totalItems = 7;
// const itemsPerPage = 1;
// const maxPaginationLinks = 3;

// const pagination = setPagination(currentPage, totalItems, itemsPerPage, maxPaginationLinks);
// console.log(pagination); // Output: [1, 4, 5, 6, 10]

// const today = new Date();
// console.log({today})
// console.log(new Date(today.setHours(0, 0, 0, 0)).toISOString())
// console.log(new Date(today.setHours(23, 59, 59, 999)).toISOString())
// console.log(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
// const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
// console.log({today})
// console.log({lastWeek})
// console.log(new Date(lastWeek.setHours(0, 0, 0, 0)).toISOString())

const timeLogObj = [
  {
    days: 1,
    hour: 7,
    min: 30
  },
  {
    days: 2,
    hour: 0,
    min: 30
  },
  {
    days: 0,
    hour: 7,
    min: 60
  },
];

let days = 0;
let hours = 0;
let minutes = 0;

timeLogObj.forEach(timeLog => {
  days += timeLog.days;
  hours += timeLog.hour;
  minutes += timeLog.min;
});

hours += Math.floor(minutes / 60);
minutes = minutes % 60;

days += Math.floor(hours / 8);
hours = hours % 8;

const spentTime = `${days}d ${hours}h ${minutes}m`;
console.log(spentTime);