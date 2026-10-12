const coffee = document.querySelector('#coffee-dialog');
document.querySelectorAll('[data-coffee]').forEach(button => button.addEventListener('click', () => coffee.showModal()));
coffee.querySelector('.close').addEventListener('click', () => coffee.close());
document.querySelector('#coffee-later').addEventListener('click', () => coffee.close());
coffee.addEventListener('click', event => {
  if (event.target === coffee) {
    const r = coffee.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) coffee.close();
  }
});
document.querySelector('#print-guide').addEventListener('click', event => { event.preventDefault(); window.print(); });
