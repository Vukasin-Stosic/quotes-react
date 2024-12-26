import { useEffect, useState } from "react";
import Quote from "./components/Quote";
import "./App.css";

function App() {
  // State management
  const [quotesData, setQuotesData] = useState([]); // Current page quotes
  const [allQuotes, setAllQuotes] = useState([]); // Total count of all quotes
  const [tags, setTags] = useState([]); // Available tags
  const [tagList, setTagList] = useState([]); // Selected tags for filtering
  const [tagedQuotes, setTagedQuotes] = useState([]); // Count of quotes matching selected tags
  const [showTags, setShowTags] = useState(false); // Togggle tag list visibility
  const [sortDirection, setSortDirection] = useState("asc"); // Sorting direction
  const [sortBy, setSortBy] = useState("createdAt"); // Sorting criteria
  const [pageNumber, setPageNumber] = useState(1); // Current page number
  const [isModalOpen, setIsModalOpen] = useState(false); // Toggles modal window
  const [newQuote, setNewQuote] = useState({
    // Creates new quote
    content: "",
    author: "",
    tags: [],
  });
  const [submitError, setSubmitError] = useState(""); // Handles submit error on creating new quote
  const pageSize = 5; // Quotes per page

  // Fetch quotes for the current page and settings
  useEffect(() => {
    refreshQuotes();
  }, [pageNumber, sortDirection, sortBy, tagList]);

  function refreshQuotes() {
    fetch(
      `https://quotes-express.onrender.com/quotes/?page=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}&tags=${tagList.join()}`
    )
      .then((response) => response.json())
      .then((data) => setQuotesData(data.quotes))
      .catch((error) => console.error("Error fetching data:", error));
  }

  // Fetch total quote count
  useEffect(() => {
    refreshAllQuotes();
  }, []);

  function refreshAllQuotes() {
    fetch("https://quotes-express.onrender.com/quotes")
      .then((response) => response.json())
      .then((data) => setAllQuotes(data.quotesCount))
      .catch((error) => console.error("Error fetching data:", error));
  }

  // Fetch available tags
  useEffect(() => {
    refreshTags();
  }, []);

  function refreshTags() {
    fetch("https://quotes-express.onrender.com/tags")
      .then((response) => response.json())
      .then((data) => setTags(data))
      .catch((error) => console.error("Error fetching data:", error));
  }

  // Fetch count of quotes matching selected tags
  useEffect(() => {
    fetch(`https://quotes-express.onrender.com/quotes/?tags=${tagList.join()}`)
      .then((response) => response.json())
      .then((data) => setTagedQuotes(data.quotesCount))
      .catch((error) => console.error("Error fetching data:", error));
  }, [tagList]);

  // Creates new quote
  function createNewQuote(e) {
    e.preventDefault();

    const tagsArray = newQuote.tags.split(",").map((tag) => tag.trim());

    if (
      !newQuote.content.trim() ||
      !newQuote.author.trim() ||
      tagsArray.length === 0
    ) {
      setSubmitError("All fields are required");
      return;
    }

    fetch("https://quotes-express.onrender.com/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: newQuote.content,
        author: newQuote.author,
        tags: tagsArray,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to create new quote.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Quote created: ", data);
        setNewQuote({ content: "", author: "", tags: [] });
        toggleModal();
        refreshQuotes();
        refreshAllQuotes();
        refreshTags();
      })
      .catch((error) => {
        console.error("Error: ", error.message);
        setSubmitError(error.message);
      });
  }

  // Render individual quotes
  const quoteElements = quotesData.map((quote) => {
    return <Quote key={quote.id} quote={quote} handleVote={handleVote} />;
  });

  // Voting logic
  function voting(id, method, votetype) {
    fetch(`https://quotes-express.onrender.com/quotes/${id}/${votetype}`, {
      method: `${method}`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete ${votetype}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Vote casted: ", data);
        refreshQuotes();
      })
      .catch((error) => {
        console.error("Error: ", error.message);
      });
  }

  function handleVote(id, votetype) {
    const item = quotesData.find((item) => item.id === id);

    if (votetype === "upvote" && item.givenVote === "none") {
      voting(id, "POST", "upvote");
    } else if (votetype === "upvote" && item.givenVote === "upvote") {
      voting(id, "DELETE", "upvote");
    } else if (votetype === "downvote" && item.givenVote === "none") {
      voting(id, "POST", "downvote");
    } else if (votetype === "downvote" && item.givenVote === "downvote") {
      voting(id, "DELETE", "downvote");
    }
  }

  // Determine total pages based on filters
  let pages;
  if (tagList.length === 0) {
    // If no filter is applied
    pages = Math.ceil(allQuotes / pageSize);
  } else {
    // If tag filter is applied
    pages = Math.ceil(tagedQuotes / pageSize);
  }

  // Generate page numbers for pagination
  const pageNumbers = [];

  for (let i = 1; i <= 5; i++) {
    // For first two pages
    if (pageNumber <= 2) {
      i <= pages ? pageNumbers.push(i) : pageNumbers;
    }
    // For last two pages
    else if (pageNumber > pages - 2) {
      pages - 5 + i > 0 ? pageNumbers.push(pages - 5 + i) : pageNumbers;
    }
    // For all the pages in between
    else if (pageNumber - 3 + i > 0 && pageNumber - 3 + i <= pages) {
      pageNumbers.push(pageNumber - 3 + i);
    }
  }

  // Render pagination buttons
  const pageNumbersElements = pageNumbers.map((number) => {
    return (
      <p
        key={number}
        className="page-number"
        onClick={handlePageChange}
        style={
          number == pageNumber ? { backgroundColor: "slategray" } : undefined
        }
      >
        {number}
      </p>
    );
  });

  // Handle page change logic
  function handlePageChange(e) {
    const data = e.currentTarget.dataset.page;
    const number = parseInt(e.currentTarget.textContent);

    setPageNumber((prevNumber) => {
      if (data === "first") {
        return 1;
      } else if (data === "last") {
        return pages;
      } else if (data === "previous") {
        return prevNumber === 1 ? 1 : pageNumber - 1;
      } else if (data === "next") {
        return prevNumber === pages ? prevNumber : prevNumber + 1;
      } else {
        return number;
      }
    });
  }

  // Toggle sorting direction
  function toggle(e) {
    const list = e.currentTarget.classList;

    if (list.contains("fa-arrow-up")) {
      list.replace("fa-arrow-up", "fa-arrow-down");
      setSortDirection("desc");
    } else {
      list.replace("fa-arrow-down", "fa-arrow-up");
      setSortDirection("asc");
    }
  }

  // Update sorting field by chosen parameter
  function sortQuotes(e) {
    setSortBy(e.currentTarget.value);
  }

  // Add or remove tags from the filter
  function updateTagList(e) {
    let tagel = e.currentTarget;
    let tagText = tagel.innerText;

    if (!tagList.includes(tagText)) {
      tagel.style.opacity = 1;
    } else {
      tagel.style.opacity = 0.5;
    }

    setTagList((prevTags) => {
      if (prevTags.includes(tagText)) {
        let newTags = prevTags.toSpliced(prevTags.indexOf(tagText), 1);
        return newTags;
      } else {
        return [...prevTags, tagText];
      }
    });

    setPageNumber(1); // Reset to the first page on tag change
  }

  // Render tags
  const tagElements = tags.map((tag) => {
    return (
      <p key={tag} className="tag" onClick={updateTagList}>
        {tag}
      </p>
    );
  });

  // Toggle tag list visibility
  function toggleTagList() {
    setShowTags((prev) => !prev);
  }

  // Toggle modal window
  function toggleModal() {
    setIsModalOpen((prev) => !prev);
  }

  // Collects new qoute data from the user
  function handleInputChange(e) {
    const { name, value } = e.currentTarget;
    setNewQuote((prev) => {
      return { ...prev, [name]: value };
    });
  }

  // Render main layout
  return (
    <div className="container">
      <h1 className="title">Quotes</h1>
      <div className="wrapper">
        <div className="flex">
          <div className="tags-wrapper">
            <p onClick={toggleTagList} className="tags-title">
              Click to show/hidde tag list
            </p>
            <div
              className="tags"
              style={{ display: showTags ? "flex" : "none" }}
            >
              {tagElements}
            </div>
          </div>
          <div className="modal-sort">
            <div className="open-modal">
              <button className="btn" onClick={toggleModal}>
                Add quote
              </button>
            </div>
            <div className="sortby">
              <label htmlFor="sort">Sort by</label>
              <div className="flex">
                <select id="sort" value={sortBy} onChange={sortQuotes}>
                  <option value=""></option>
                  <option value="author">Author</option>
                  <option value="createdAt">Date</option>
                  <option value="upvotesCount">Upvotes</option>
                </select>
                <span className="direction">
                  <i className="fa-solid fa-arrow-up" onClick={toggle}></i>
                </span>
              </div>
            </div>
          </div>
        </div>
        {quoteElements}
      </div>
      <div className="pagination">
        <i
          data-page="first"
          className="fa-solid fa-angles-left page-number"
          onClick={handlePageChange}
          style={pageNumber == 1 ? { backgroundColor: "slategray" } : undefined}
        ></i>
        <i
          data-page="previous"
          className="fa-solid fa-angle-left page-number"
          onClick={handlePageChange}
          style={pageNumber == 1 ? { backgroundColor: "slategray" } : undefined}
        ></i>
        {pageNumbersElements}
        <i
          data-page="next"
          className="fa-solid fa-angle-right page-number"
          onClick={handlePageChange}
          style={
            pageNumber == pages ? { backgroundColor: "slategray" } : undefined
          }
        ></i>
        <i
          data-page="last"
          className="fa-solid fa-angles-right page-number"
          onClick={handlePageChange}
          style={
            pageNumber == pages ? { backgroundColor: "slategray" } : undefined
          }
        ></i>
      </div>
      {isModalOpen && (
        <div className="modal" onClick={toggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create new quote</h2>
            <form onSubmit={createNewQuote}>
              <label htmlFor="quote">Add quote text</label>
              <textarea
                type="text"
                name="content"
                id="quote"
                value={newQuote.content}
                onChange={handleInputChange}
              ></textarea>
              <label htmlFor="author">Add author name</label>
              <input
                type="text"
                name="author"
                id="author"
                value={newQuote.author}
                onChange={handleInputChange}
              />
              <label htmlFor="tags">Add tags</label>
              <input
                type="text"
                name="tags"
                id="tags"
                value={newQuote.tags}
                onChange={handleInputChange}
              />
              <button type="submit" className="btn action">
                Create
              </button>
              {submitError && <p>{submitError}</p>}
            </form>
            <div className="btn close" onClick={toggleModal}>
              &times;
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
