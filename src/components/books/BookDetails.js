import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Container from "../../helpers/wrapper/Container";
import styled from "./BookDetails.module.css";
import Loading from "../../helpers/modal/Loading";
import Modal from "../../helpers/modal/Modal";
import AddToLibrary from "../library/AddToLibrary";
import { AuthContext } from "../../contexts/authContext";
import Login from "../login/Login";
import EmptyShelf from "./EmptyShelf";
import webSearch from "../../images/web_search.svg";
import server from "../../images/server_down.svg";
import ScrollToTop from "../../helpers/routes/ScrollToTop";
import { useSelector } from "react-redux";
import { RiBookmarkFill } from "react-icons/ri";

//component to show book details
const BookDetails = () => {
  const { bookId } = useParams();
  const { library } = useSelector((state) => state.bookStore);
  const { currentUser, isSignedIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState([]);
  const [openLibraryModal, setOpenLibraryModal] = useState(false);
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const descriptionRef = useRef("");
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  const auth = currentUser.email && isSignedIn;

  const libraryUser = library.find(
    (record) => record.user === currentUser?.email
  );

  const isInLibrary = libraryUser?.userLibrary?.find(
    (book) => book.bookData.id === bookId
  );

  //fetch data using the given book ID and set the selectedBook state
  useEffect(() => {
    const url = ` https://www.googleapis.com/books/v1/volumes/${bookId}`;
    const fetchById = async () => {
      setLoading(true);
      try {
        const response = await fetch(url);
        const data = await response.json();
        setSelectedBook(data.volumeInfo);
      } catch (error) {
        setError(error);
      }
      setLoading(false);
    };
    fetchById();
  }, [bookId]);

  //if the selectedBook is not empty, update the innerHTML value with the given data since the description includes html tags
  useEffect(() => {
    if (selectedBook?.description && descriptionRef.current) {
      descriptionRef.current.innerHTML = `${selectedBook.description}`;
    }
  }, [selectedBook]);

  //remove duplicate categories
  const categorySet = new Set(selectedBook?.categories);
  const categories = [...categorySet]?.map((category, index) => {
    return (
      <p className={styled.category} key={Date.now() + index}>
        {category}
      </p>
    );
  });

  /** if user is signed in, open the add to library modal
   * if user is not signed in, open the login modal
   */
  const handleLibrary = () => {
    if (auth) {
      setOpenLibraryModal((state) => !state);
    } else {
      setOpenLoginModal((state) => !state);
    }
  };

  const handleAuthor = () => {
    if (selectedBook?.authors) {
      navigate(`/results?search=${selectedBook?.authors[0]}`);
    }
  };

  const src = selectedBook?.imageLinks?.thumbnail
    ? `${selectedBook?.imageLinks?.thumbnail}`
    : "https://via.placeholder.com/150";

  if (!selectedBook && !error) {
    return (
      <Container className={styled.info}>
        <EmptyShelf
          src={webSearch}
          heading="No results found."
          message="Try searching for another book or visit the Explore page."
          button="Explore"
          route="/explore"
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className={styled.info}>
        <EmptyShelf
          src={server}
          heading="There was error when fetching the data"
          message="Try searching for another book or visit the Explore page."
          button="Explore"
          route="/explore"
        />
      </Container>
    );
  }

  const success = !loading && selectedBook.length !== 0 && !error;

  return (
    <ScrollToTop>
      <section className={styled.info}>
        {loading && <Loading />}

        {success && (
          <Container className={styled["book-details-container"]}>
            <div className={styled["img-group"]}>
              <figure className={styled.cover}>
                <img src={src} alt={selectedBook?.title} />
                {isInLibrary && (
                  <div className={styled.bookmarked}>
                    <RiBookmarkFill
                      style={{ color: "var(--yellow)" }}
                      size="35px"
                    />
                  </div>
                )}
              </figure>

              <div className={styled["btn-group"]}>
                <button onClick={handleLibrary}>Add to Library</button>
                <button onClick={handleAuthor}>More by Author</button>
              </div>
            </div>

            <article className={styled["book-info"]}>
              <h1 className={styled.title}>{selectedBook?.title}</h1>

              {selectedBook?.subtitle && (
                <p className={styled.subtitle}>{selectedBook?.subtitle}</p>
              )}

              {selectedBook?.authors && (
                <p className={styled.author}>{selectedBook?.authors[0]}</p>
              )}

              {categories.length !== 0 && (
                <div className={styled["book-categories"]}>{categories}</div>
              )}

              <p className={styled.description} ref={descriptionRef}>
                {selectedBook?.description === undefined && (
                  <p>No description available</p>
                )}
              </p>
            </article>
          </Container>
        )}

        {openLibraryModal && (
          <Modal
            openModal={openLibraryModal}
            setOpenModal={setOpenLibraryModal}
          >
            <AddToLibrary
              selectedBook={selectedBook}
              setOpenModal={setOpenLibraryModal}
            />
          </Modal>
        )}

        {openLoginModal && (
          <Modal openModal={openLoginModal} setOpenModal={setOpenLoginModal}>
            <Login setOpenModal={setOpenLoginModal} />
          </Modal>
        )}
      </section>
    </ScrollToTop>
  );
};

export default BookDetails;
