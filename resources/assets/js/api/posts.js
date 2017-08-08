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
            l.start();
            api.get(this.model)
                .then(data => {
                    console.log(data);
                    this.posts = data;
                    store.commit(types.post.NAME + '/' + types.post.REPLACE_POSTS, data);
                    resolve(data);
                    l.stop();
                })
                .catch(error => {
                    s.fire("Something went wrong", 'error');
                    l.stop();
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
            l.start();
            api.post(this.model, sendP)
                .then(newPost => {
                    store.commit(types.post.NAME + '/' + types.post.ADD_NEW_POST, newPost);
                    l.stop();
                    resolve(newPost);
                })
                .catch(error => {
                    s.fire("Something went wrong", 'error');
                    l.stop();
                    reject(error);
                })
        })
    }


}

export default new Post();