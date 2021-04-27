     try{

  const candidate = emoji.parentElement;
        const trashCan = document.getElementById('trashCan'); //TODO:
        const trashBall = document.createElement('div');
        const trashBallHide = document.querySelector('.trashCan__ball2');
        trashBallHide.textContent = fave;
        trashBall.classList.add('trashCan__ball');
  if(1){//remove any current animations from candidate
        anime.remove(candidate);

        // trashCan will slide on the screen this amount
        const canMovesX = 200;
        const canIsHalfway = anime.timeline({
          //  autoplay: false
        }).add({
          targets: trashCan.querySelector('.trashCan__hand'),
          rotate : [0, 90],
          begin  : a => {
            trashBallHide.classList.add('trashCan__ball2--hide');
          }
        });

        const canAnime = new Promise((resolve, reject) => {
          anime.timeline().add({
            targets   : trashCan,
            translateX: canMovesX + 'px',
            duration  : 4000,
            easing    : 'easeInQuint',
            update    : a => {
              if (a.progress > 75) {
                resolve(a);
              }
            }
          });
        });

        //TODO: do this at the end
        //make a different emoji active so we can delete the candidate
        let deletePosition = myFavs.position;

        //before delete
        document.getElementById('scrollDown').click();

        trashBall.classList.add('history--draggable');
        //remove candidate from the current position in dom hiearchy
        //promote it to an element at (0,0)
        // document.body.append(trashBall);

        //store where the current element is
        // calculate the difference from start location to final-trash-location
        const startXY = {};
        const diffXY = {};
        (({top, left, height, width}, {top: endT, left: endL}) => {
          Object.assign(startXY, {
            top   : top,
            left  : left,
            height: height,
            width : width
          });
          Object.assign(diffXY, {
            top : endT - top,
            //consider trashCan's future translateX ?
            left: (endL + canMovesX) - left
          });
        })(emoji.getBoundingClientRect(), trashCan.getBoundingClientRect())


        //resize the candidate to match the start size of the trash
        const ballForm = anime.timeline({
          targets : candidate,
          autoplay: false,
          scale   : 1,
          complete: a => {
            trashBall.append(emoji);
          }
          //duration : 1000
        });

        document.body.append(trashBall);
        //size the container before remove candidate
        //make the candidate appear like it has not moved
        anime.set(trashBall,
          Object.assign({}, startXY)
        );

        if (candidate.classList.contains('history--draggable')) {
          //TODO: not sure if this is a different case
        } else {

          //prevent the history list from collapsing
          //TODO:prevent the history list from collapsing

          trashBall.classList.add('history--draggable');
        }

        //track the other elements related to candidate ( for later removal)
        let draggableClasses = [...(candidate.classList)].filter(c => /draggable\d/.test(c));

        //JSON.parse(JSON.stringify(candidate.getBoundingClientRect())));
        let arcTop = diffXY.top - 500;

        const Xfudge = inGallery ? 30 : 30;
        const Yfudge = inGallery ? -100 : -80;

        let ballFlight;
        const ballFlightP = new Promise((resolve, reject) => {
          ballFlight = anime.timeline({
            autoplay: false
          }).add({
            targets   : trashBall, // document.querySelector('.highlight'),
            translateY: [
              {
                value   : arcTop,
                duration: 1000,
                easing  : 'easeOutQuad'
              },
              {
                value   : diffXY.top + Yfudge,
                duration: 800,
                easing  : 'easeInQuad'
              },
              {

                value   : diffXY.top + Yfudge + 20,
                duration: 200,
                easing  : 'linear'

              }
            ],
            translateX: [
              {
                value   : diffXY.left + Xfudge,
                duration: 1800,
                easing  : 'linear'
              }
            ],
            begin     : a => {
              //spin emoji inside the ball
              anime({
                targets: emoji,
                rotate : [{
                  value   : 90,
                  duration: 500,
                  easing  : 'easeInQuad'
                },
                  {
                    value   : 940,
                    duration: 1000,
                    easing  : 'linear'
                  },
                  {
                    value   : 90,
                    duration: 500,
                    easing  : 'easeOutQuad'
                  }]
              })
            },
            update    : a => {
              //ball-up/crumple in the last half of the flight
              if (a.progress > 85) {
                emoji.textContent = fave;
              } else if (a.progress > 50) {
                emoji.textContent = '🏐'
              }
            },
            complete  : a => {
              resolve(a);
            }
          });
        });
        let canAnimeW = await canAnime;
        //await Promise.all([ canIsHalfway.finished, canAnime.startSlide]);
        //        canAnime.play();

        ballForm.play()
        ballFlight.play();

        await ballFlightP;

        ballFlight.remove('*');
        //delete emoji objects
        console.log('completed... would be removed');

        //delete emoji and candidate elements
        draggableClasses.forEach(draggables => {
          [...document.getElementsByClassName(draggables)].forEach(el => el.remove());
        });

        //remove the real ball
        trashBall.remove();
        //replace it with a fake one that is in the can
        trashBallHide.classList.remove('trashCan__ball2--hide');

        //slide trashcan out of view
        canAnimeW.reverse();
        canAnimeW.play();

        //slide ball with trashCan
        await canAnimeW.finished;

        //hide the fake ball again (for next time)
        trashBallHide.classList.add('trashCan__ball2--hide');

        //very last thing -- delete the emoji from cache
        myFavs.trashFave(fave);

        //  });
      }
    } catch (e) {
      console.log('trashCan error:',e);
      this.classList.add('pressed--error');
    }
    this.classList.remove('pressed');