class App extends React.Component {
  /* From my understand of the project
    I am supposed to create a grid of products from a json-server endpoint running at PORT: 3000
    And I am also supposed to display ads within this grids at some point,
    I am going to do this by displaying an ads after every 20 items displayed
  */
  componentDidMount(){
    this.sort(); // sort is used to fetch from the API, it uses this.state.type to decide what it fetches
    // on default this.state.type is set to all i.e; /products endpoint
    document.addEventListener('scroll', this.trackScrolling);
    // When the component mounts, I also want to start an event listener to know if user is at the end of the list
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.trackScrolling);
    // when component unmounts, I need to remove event listener
  }

  state = {
    products: [], // this is array of products the user sees. An array of objects
    type: 'all', // this determines how to sort products
    allProducts: [], // products are divided in batches and stored here. An array of arrays
    len: 0, // length of this.state.allProducts
    position: 0, // For tracking
    loading: true, // To know if product fetching is going on
    loadingText: 'loading...', // simple animated text
    endLoading: '', // describes scrolling stage 
    end: false,
    loader: 'loading...'
  }

  /*
  This two functions below are used to calculate the number of days between two dates
  I use them to determine the '3 days ago' feature
  */

  parseDate = (str) => {
    // it takes a string like this 01/01/2019
    var mdy = str.split('/');
    return new Date(mdy[2], mdy[0]-1, mdy[1]);
  }

  datediff = (first, second) => {
    // This takes two argument and return the number of days between them
    return Math.round((second-first)/(1000*60*60*24));
  }

  formatDate = (date) => {
    // the variable MONTHS is what I use to display months instead of displaying it by number
    let MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
    todayDate = new Date().toLocaleString(), // To get todays date so I can compare it to the date of product
    format = date.split(','), formatToday = todayDate.split(','), 
    d = format[0].split('/'), t = format[1].split(':');
    let result,
    diff = this.datediff(this.parseDate(format[0]), this.parseDate(formatToday[0]));
    if (diff <= 7){
      // if the difference in dates is less than or equal to a week which is seven days
      // then it checks if it is 1 and displays 1 day ago ; ) else it displays something like 3 days ago
      // If it is 7 , It says a week ago
      result = (diff === 1) ? diff + ' day ago' : (diff < 7 && diff !== 1) ? diff + ' days ago' : 'a week ago'
    } else {
      // here it is farther than a week so we display it this way
      result = d[1] + ' ' + MONTHS[parseInt(d[0]) - 1] + ' ' + d[2] + ',' + t[0] + ':' + t[1] + ' ' + t[2].substr(-2);
    }
    return result;
  }

  typeWriter = (loading, loadingText) => {
      // let { loadingText, loading } = this.state;
      // Here is my animated "loading..."
    if (this.state[loading] && this.state[loadingText].length < 10) {
      // loading... is a string with a length of 10 so if it is less than that say "loading" or "loading."
      // then it adds a dot to it after 0.2 secs
      setTimeout(()=>{
        this.setState({ [loadingText]: this.state[loadingText] + '.' })
        this.typeWriter(loading, loadingText) // simple recursion
      }, 200)
    } else if (this.state[loading] && this.state[loadingText].length === 10){
      // else if is equal to loading... , then set it back to loading and use recursion Haha
      setTimeout(()=>{
        this.setState({ [loadingText]: 'loading' })
        this.typeWriter(loading, loadingText) // simple recursion
      }, 200)
    }
  }

  sort = () => {
    this.setState({ loading: true }, ()=>this.typeWriter("loading", "loadingText")) // anytime sort() is called, I do the animated loading... function
    let { type } = this.state;
    // I run the fetch based on this.state.type, it helps with the sorting by price, size and id, if its 'all', then it fetchs with no sorting
    let url = (type === 'all') ? '/products' : `/api/products?_sort=${type}`; 
      fetch(`${url}`,{
        method: 'GET'
      })
      .then((response)=>response.json())
      .then((result)=>{
        // what I want to do here is display only 40 items to user until they get to the bottom and then I add more 
        const tempArray = [...result], // replicate array data
        arrays = [],
        size = 40;
        while (tempArray.length > 0) {
          // as long as tempArray is not empty, push an array of 40 items into it
          arrays.push(tempArray.splice(0, size));
        }    

        let counter = 0;
        // I create an incremental counter after fetching products and intend to use it to distinguish every 20 items
        let products = [];

        arrays[0].map((val)=>{
          counter = counter + 1; // counter++

          // I say if counter is divisble by 20 (every 20 item)
          // then concat the existing products array contents, an item from the result and a new object denoting ads
          // else just concat only the existing products array contents and an item from the result
          products = (counter % 20 === 0) ? [...products, val, { ads: true, size: '40%', url: this.genRand() }] : [...products, val];
        })
        this.setState({ 
          products, 
          loading: false, 
          allProducts: arrays, 
          len: arrays.length, 
          position: 0 
        });
      })
      .catch((error)=>console.log('Error:', error))
  }

  runBottomFunc = async () => {
    // this function runs when user gets to the bottom of list, either it loads more products or it says "~ END OF CATALOGUE ~"
    if (this.state.position < (this.state.len - 1) && !this.state.loading){
      let newPosition = this.state.position + 1;
      let additional = this.state.allProducts[newPosition];
      let counter = 0;
      let array = [];
      // Dunno how long this will take so I use await. Its also not in the .then so it will act funny without await ; )
      await additional.forEach((val)=>{
        counter = counter + 1;
        // add ads
        array = (counter % 20 === 0) ? [...array, val, { ads: true, size: '40%', url: this.genRand() }] : [...array, val];
      })
      const products = [...this.state.products, ...array ];
      // I know I'm duplicating code here (no DRY), I would have just done a function and used it in the sort function and this 
      // But I wanted my code to be as clear as possible
      await setTimeout(()=>{
        this.setState({ products, position: newPosition, loader: '', end: false })
      }, 1000) // a little delay for better UX and so that you can notice it is getting more products in
    } else if (this.state.position === (this.state.len - 1) && !this.state.loading){
      this.setState({ end: false, endLoading: "~ END OF CATALOGUE ~" });
      // this is the end message if the position and the len are equal
    }
  }

  trackScrolling = () => {
    // this function is what is used in the scroll event listener
    const wrappedElement = document.getElementById('row');
    if (this.isBottom(wrappedElement)) {
      this.setState({ loader: 'loading...', end: true },
      ()=>{
         this.typeWriter("end", "loader")
         this.runBottomFunc()
      })
    }
  };

  isBottom = (el) => {
    return el.getBoundingClientRect().bottom <= window.innerHeight;// checks if el's bottom has been reached
  }

  genRand = () => {
    const rand = Math.floor(Math.random()*10000);
    const url = '/ads/?r=' + rand;
    return url;
  }
  
  render() {
    const { products, loading, type, endLoading, loadingText, end, loader } = this.state;
    if (loading) {
      return (
        <div className="loading">
          <span>{loadingText}</span>
        </div>
      )
    }
    return (
      <div className="container">
          <select 
          className="form-control select"
          onChange={(e) => {
            e.preventDefault();
            let { value } = e.target;
            this.setState({ type: value },()=>this.sort())
          }}
          value={type}
          >
            <option key={0} value={'all'}>{'Sort all Products'}</option>
            <option key={1} value={'price'}>{'Sort by PRICE'}</option>
            <option key={2} value={'size'}>{'Sort by SIZE'}</option>
            <option key={3} value={'id'}>{'Sort by ID'}</option>
          </select>
        <div className="row" id="row">
          {
            !loading && products.map((val, idx)=>{
              let date = new Date(val.date).toLocaleString()
              // for every map rounds, a random ads is generated
              if (val.ads){
                return (
                  <div className="ads">
                    <p>Here you're sure to find a bargain on some of the finest ascii available to purchase. Be sure to peruse our selection of ascii faces in an exciting range of sizes and prices.</p>  
                    <p>But first, a word from our sponsors:</p>
                    <img className="ad" id="ad" src={val.url} />
                  </div>
                )
              } else {
                return (
                  <div className="col-9 mx-auto col-md-6 col-lg-3 my-3 p-5">
                    <div className="card boxshadow" key={idx}>
                      <div className="face">
                        <h3 style={{
                          fontSize: val.size
                        }}>{val.face}</h3>
                      </div>
                      <div className="card-footer justify-content-between">
                        <p className="align-self-center mb-0 small" style={{ fontWeight: type === 'price' ? 'bold' : 'normal' }}>
                          Price: <span className="mr-1">{'\u0024'}</span>{val.price / 100}
                        </p>
                        <p className="align-self-center mb-0 small" style={{ fontWeight: type === 'size' ? 'bold' : 'normal' }}>
                          Size: {val.size}
                        </p>
                        <p className="text-blue font-italic mb-0 smallest">
                          {this.formatDate(date)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
            })
          }
        </div>
        {
          (end === true && loader !== '') && 
          <div className="loading">
            <span>{loader}</span>
          </div>
        }
        {
          (endLoading !== '') &&
          <div className="loading">
            <span>{endLoading}</span>
          </div>
        }
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// I used react cdn instead of create react app or webpack to save time, and also to not change the project folder structure
// I can never use the cdn for production. I just tried to reduce complexity