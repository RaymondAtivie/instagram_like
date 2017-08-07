import api from './index';
import s from './../helpers/snackbar';
import l from './../helpers/loader';
import store from './../store/store';
import types from './../store/types';

class Post {

    constructor() {
        this.model = 'posts';
        this.posts = [];
        // this.last_fetch = moment();
    }

    getAll() {
        return new Promise((resolve, reject) => {

            api.get('posts')
                .then(data => {
                    console.log(data);
                    this.posts = data;
                    store.commit(types.post.NAME + '/' + types.post.REPLACE_POSTS, data);
                    resolve(data);
                })
                .catch(error => {
                    s.fire("Something went wrong", null, 'error');
                    reject(error);
                })

        })
    }

    addPost(post) {
        let sendP = {
            user_id: 1,
            text: post.text,
            report: post.report,
        }
        if (post.media) {
            sendP.media = post.media.link
        }
        return new Promise((resolve, reject) => {

            setTimeout(() => {

                api.post('posts', sendP)
                    .then(newPost => {
                        store.commit(types.post.NAME + '/' + types.post.ADD_NEW_POST, newPost);
                        resolve(newPost);
                    })
                    .catch(error => {
                        s.fire("Something went wrong", null, 'error');
                        reject(error);
                    })
            }, 5000)


        })
    }


}

export default new Post();