import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';
import ajaxDelete from './modules/delete';

autocomplete( $('#habitat'), $('#lat'), $('#lng') );

typeAhead( $('.search') );

makeMap( $('#map') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);

const deleteAnimalBtn = $('.delete__button');

if (deleteAnimalBtn) {
  deleteAnimalBtn.on('click', ajaxDelete);
}
