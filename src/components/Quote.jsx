export default function Quote({ quote, handleVote }) {
  const upvote = quote.upvotesCount;
  const downvote = quote.downvotesCount;
  const percentage =
    upvote === 0 ? 0 : Math.round((upvote / (upvote + downvote)) * 100);

  let color = "";

  if (percentage == 100) {
    color = "limegreen";
  } else if (percentage > 75) {
    color = "greenyellow";
  } else if (percentage > 50) {
    color = "yellow";
  } else if (percentage > 25) {
    color = "orange";
  } else {
    color = "red";
  }

  const vote = quote.givenVote;

  function handleClick(e) {
    let votetype = e.currentTarget.dataset.votetype;
    handleVote(quote.id, votetype);
  }

  return (
    <div className="quote-wrapper">
      <div className="votes">
        <div
          data-votetype="upvote"
          className="arrow"
          style={{ opacity: vote == "upvote" ? 1 : 0.5 }}
          onClick={handleClick}
        >
          <i className="fa-solid fa-caret-up"></i>
        </div>
        <div className="percentage" style={{ color: color }}>
          <span>{percentage}</span>%
        </div>
        <div>
          <span className="up_vote">{quote.upvotesCount}</span>/
          <span className="down_vote">{quote.downvotesCount}</span>
        </div>
        <div
          data-votetype="downvote"
          className="arrow"
          style={{ opacity: vote == "downvote" ? 1 : 0.5 }}
          onClick={handleClick}
        >
          <i className="fa-solid fa-caret-down"></i>
        </div>
      </div>
      <div className="quote">
        <blockquote>
          <p className="quote-text">{quote.content}</p>
        </blockquote>
        <p className="quote-author">&minus;{quote.author}</p>
      </div>
    </div>
  );
}
