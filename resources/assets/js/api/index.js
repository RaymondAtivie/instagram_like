class Api {

    get(url) {
        return new Promise((resolve, reject) => {
            axios.get(url)
                .then(({ data }) => {
                    resolve(data);
                })
                .catch(({ response }) => {
                    reject(response);
                })
        })
    }

    post(url, data) {
        return new Promise((resolve, reject) => {
            axios.post(url, data)
                .then(({ data }) => {
                    resolve(data);
                })
                .catch(error => {
                    if (error.response) {
                        reject(error.response);
                    } else if (error.request) {
                        reject(error.response);
                    } else {
                        reject(error.message);
                    }
                });
        })
    }

}

export default new Api;