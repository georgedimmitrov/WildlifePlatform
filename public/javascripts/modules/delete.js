import axios from 'axios';
import { $ } from './bling';

// sends a post request to delete an animal from DB
function ajaxDelete(e) {
  e.preventDefault();

  let deleteBtn = e.target;

  // just in case - should never be in this case
  if (!deleteBtn || (deleteBtn && deleteBtn.classList.contains('delete__button'))) {
    deleteBtn = $('.delete__button');
  }

  if (deleteBtn) {
    if (confirm('Are you sure you want to delete this record?')) {
      axios
      .post(`/api/remove/${deleteBtn.getAttribute('data-id')}`)
      .then(res => {
        // console.log('res is: ', res.data);
        // redirect user to '/'
        window.location.href = '/';
      })
      .catch(err => console.log(err));
    }
  }
}

export default ajaxDelete;