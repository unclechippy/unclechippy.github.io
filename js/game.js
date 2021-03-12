var ALL_CARDS = [2,3,4,5,6,7,8,9,10,'J', 'Q', 'K', 'A']; 
var COUNTER = 1; //track replications

//class for handling decks and cards
class Deck{
  constructor(num_decks){
    this.cards = [];
    this.discards = [];
    this.shuffle_num;
    this.num_decks = num_decks;
  }

  //add all cards minus suit
  add_cards(){
    let face_cards = ['J', 'Q', 'K', 'A'];
    for(let i = 0; i < 4; i++){
      for(let j = 2; j<11; j++){
        this.cards.push(j);
      }
      for(let i = 0; i<face_cards.length; i++){
        this.cards.push(face_cards[i]);
      }
    }
  }
  
  //test to make sure our card total is correct
  verify_card_totals(){
    //confirm we have the correct number of cards
    if ((this.cards.length + this.discards.length) != this.num_decks*52){
      alert(`Not enough card in deck. Num decks: ${this.num_decks}. Total cards: ${this.cards.length}`);
    }
  }

  //initialize the deck
  init(){
    for (let i = 0; i < this.num_decks; i++){
      this.add_cards();
    }
    
    if (this.num_decks > 1){
      this.shuffle_num = 60 + Math.floor(Math.random() * 15); //shuffle point between 60 and 75 cards
    }else{
      this.shuffle_num = 25;
    }
  }

  //take card from random position in the deck array and add to discards to shuffle later
  get_card(){
    let card_index = Math.floor(Math.random() * this.cards.length); //select a random card from the deck
    let card = this.cards[card_index];
    this.cards.splice(card_index, 1);
    this.discards.push(card); //add to discards
    return card;
  }

  //find a specific card from the deck and return it
  get_chosen_card(value){
    let card_index = this.cards.findIndex((element) => element == value);

    let card = this.cards[card_index];
    this.cards.splice(card_index, 1);
    this.discards.push(card); //add to discards
    return card;

  }

  //check to see if we need to shuffle and shuffle if needed
  check_shuffle(){
    if (this.shuffle_num >= this.cards.length){
      this.shuffle();
    }
  }

  //return the discards to the deck and change the shuffle point
  shuffle(){
    this.cards = this.cards.concat(this.discards);
    this.discards = [];
    if (this.cards.length == 52){
      this.shuffle_num = 25;
    }else{
      this.shuffle_num = 60 + Math.floor(Math.random() * 15); //shuffle point between 60 and 75 cards
    }

    this.verify_card_totals();

  }
}

//player and house hand class
class Hand{
  constructor(){
    this.cards = []; //player cards
    this.value = [0,0]; //soft value first, hard value second
    this.states = []; //record all states
    this.bet = 1;
    this.has_ace = false;
  }

  //get the soft value of the cards
  get_soft_value(){
    return this.value[0];
  }

  //get the hard value of the cards
  get_hard_value(){
    return this.value[1];
  }

  //get value of either soft of hard version of hand depending on which is better
  get_hand_value(){
    if (this.get_hard_value() < 21){
      return this.get_hard_value();
    } else {
      return this.get_soft_value();
    }
  }

  //get a random card, add to hand, and update value of hand
  get_card(deck){
    let card = deck.get_card();
    
    //add all card values
    this.update_card_value(card);

    //add cards to hand
    this.cards.push(card);
  }

  //get a specific card, add to hand, and update value of hand
  get_chosen_card(deck, card_value){
    let card = deck.get_chosen_card(card_value);

    //add all card values
    this.update_card_value(card);

    //add cards to hand
    this.cards.push(card);
  }

  //return all cards in the hand
  get_cards_in_hand(){
    return this.cards;
  }

  //update the value of the hand; first value is soft, second is hard
  update_card_value(card){
    if (card == "A"){
      //only count the first ace as 11 in the hard hand
      if(!this.has_ace){
        this.has_ace = true;
        this.value[1] += 10;
      }
      this.value[0] += 1;
      this.value[1] += 1;
    }else if ((card == "K") || (card == "Q") || (card == "J")) {
      this.value[0] += 10;
      this.value[1] += 10;
    }else{
      this.value[0] += card;
      this.value[1] += card;
    }
  
  }

  //get the initial card value to check for initial blackjack and to record state for house
  get_initial_card_value(){
    let card = this.cards[0];
    if (card == "A"){
      return 11;
    }else if ((card == "K") || (card == "Q") || (card == "J")) {
      return 10;
    }else{
      return card;
    }
  }

  //track all the states for this hand
  add_state(initial_house_card_value, action){
    this.states.push(new State(this.get_soft_value(), this.get_hard_value(), initial_house_card_value, action));
  }

  //record a "W" for a win and a "L" for a loss
  record_result(result){
    for (let i = 0; i < this.states.length; i++){
      this.states[i].result = result;
    }
  }

}

//class to store state information
class State{
  constructor(player_soft_value, player_hard_value, initial_house_card_value, action){
    this.player_soft_value = player_soft_value;
    this.player_hard_value = player_hard_value;
    this.initial_house_card_value = initial_house_card_value;
    this.action = action;
  }
}

//main class for running multiple games
class Game{
  constructor(){
    this.deck = new Deck(1); //1 deck
    this.deck.init(); 
    this.player_unplayed_hands = [];
    this.player_hands = []; //player may have multiple hands with splits
    this.house_hand;
    this.initial_strategy = false;

    this.results = {};
    this.game_over = false;
    this.winnings = 0;
    this.data = new Data(); //store results from game
  }

  clear_data(){
    this.data = new Data();
  }

  //deal 2 cards to the player and one card to the dealer
  deal(){
    //house
    this.house_hand = new Hand();
    this.house_hand.get_card(this.deck);

    //player
    this.player_hands = []; //reset the player hand
    this.player_unplayed_hands = [new Hand()];
    this.player_unplayed_hands[0].get_card(this.deck);
    this.player_unplayed_hands[0].get_card(this.deck);
  }

  //get specific card values for player and dealer
  deal_specific_cards(player_hard_hand_value, player_has_ace, initial_house_card){
    //house
    this.house_hand = new Hand();
    this.house_hand.get_chosen_card(this.deck, initial_house_card);

    //player
    this.player_hands = []; //reset the player hand
    this.player_unplayed_hands = [new Hand()];

    //select a card based on the total player hand value
    let card_choices = [2,3,4,5,6,7,8,9,10,'J', 'Q', 'K']; //exclude aces

    //any inital card except ace can be chosen unless player hand value is less than 12
    if (player_has_ace){
      this.player_unplayed_hands[0].get_chosen_card(this.deck, "A");
    } else if (player_hard_hand_value < 12){ //not all cards can be chosen
      let i =  Math.floor(Math.random() * (player_hard_hand_value - 4));
      this.player_unplayed_hands[0].get_chosen_card(this.deck, card_choices[i]);
    } else if (player_hard_hand_value > 12) { //not all cards can be chosen
      let i =  (player_hard_hand_value - card_choices.length) + Math.floor(Math.random() * (24 - player_hard_hand_value));
      this.player_unplayed_hands[0].get_chosen_card(this.deck, card_choices[i]);
    } else { //any card can be chosen
      let i =  Math.floor(Math.random() * card_choices.length);
      this.player_unplayed_hands[0].get_chosen_card(this.deck, card_choices[i]);
    }
    
    let remaining_card_value = (player_hard_hand_value - this.player_unplayed_hands[0].get_hard_value());
    if (remaining_card_value == 10){ //any 10 can be chosen
      let j =  8 + Math.floor(Math.random() * 4);
      this.player_unplayed_hands[0].get_chosen_card(this.deck, card_choices[j]);
    }else{
      this.player_unplayed_hands[0].get_chosen_card(this.deck, remaining_card_value); 
    }
    
    if (this.player_unplayed_hands[0].get_hard_value() != player_hard_hand_value){
      alert(`Player card total is not correct. Requested: ${player_hard_hand_value} Given: ${this.player_unplayed_hands[0].cards}`);
    }
  }

  //check to see if we have 21
  check_for_21(hand){
    if (hand.get_hard_value() == 21){
      return true;
    }else{
      return false;
    }
  }

  play(){
    //check player for natural blackjack
    if (this.check_for_21(this.player_unplayed_hands[0])){
      //get 2nd card for house and check for 21
      this.house_hand.get_card(this.deck);
      if(this.check_for_21(this.house_hand)){
        this.end_player_turn();
        this.player_hands[0].add_state(this.house_hand.get_hard_value(), "S"); //add state to record push
        this.player_push(this.player_hands[0]);
      }else{
        this.end_player_turn();
        this.player_hands[0].add_state(this.house_hand.get_hard_value(), "S"); //add state to record win
        this.player_win_natural_blackjack(his.player_hands[0]);
      }

    }else if (this.house_hand.get_hard_value() == 11){//check for house 21 if ace showing
      //for tracking insurance - excluded for now
    }

    


    //only play hands that have been not_played
    while(this.player_unplayed_hands.length > 0){
      this.play_next_player_turn();
    }

    //play house turn if the game is not over
    if (!this.game_over){
      this.play_house_turn();
    }

    //record winner if game isn't already over
    if (!this.game_over){

      let player_hand_value;

      //iterate over all player hands
      for (let i = 0; i < this.player_hands.length; i++){
        if (this.player_hands[i].get_hard_value())

        if(this.house_hand.get_hand_value() > this.player_hands[i].get_hand_value()){
          this.house_win(this.player_hands[i]);
        }else if (this.house_hand.get_hand_value() < this.player_hands[i].get_hand_value()){
          this.player_win(this.player_hands[i]);
        }else {
          this.player_push(this.player_hands[i]);
        }
      }

    }

    this.end_game();

  }

  //play player turn
  play_next_player_turn(){
    
    let stay_threshold = 21;
    let action;

    while(true){
      //choose an action based on the current state
      if(this.player_unplayed_hands[0].get_hand_value() < stay_threshold){
        
        //if this is the first initial hand play the designated strategy; else try to play the best strategy; else random action
        if ((this.player_hands.length == 0) && (this.player_unplayed_hands[0].cards.length) == 2 && this.initial_strategy){
          action = this.initial_strategy;
        }else if (this.data.get_best_strategy(this.data.hard_result_dict, this.player_unplayed_hands[0].get_hand_value(), this.house_hand.get_initial_card_value())){
          //get soft or hard?
          action = this.data.get_best_strategy(this.data.hard_result_dict, this.player_unplayed_hands[0].get_hand_value(), this.house_hand.get_initial_card_value());
        }
        else{ //randomly choose an action
          let actions = ["H", "S"];
          action = actions[Math.floor(Math.random() * actions.length)];
        }
      
      }else{
        action = "S";
      }

      //end turn and record loss if player soft hand value above 21
      if (this.player_unplayed_hands[0].get_soft_value() > 21){
        this.end_player_turn();
        this.house_win(this.player_hands[0]);
        return;
      }

      //update the state
      this.player_unplayed_hands[0].add_state(this.house_hand.get_hard_value(), action);

      //if player chooses stay
      if (action == "S"){
        this.end_player_turn();
        return;
      }else if (action == "H"){
        this.player_unplayed_hands[0].get_card(this.deck);
      }
    }
  }

  //the house turn
  play_house_turn(){
    //alert(this.player_hand_value[0]);
    //house hits if soft value is 17 or less
    while(true){
      //house hits on soft 17
      if (this.house_hand.get_soft_value() < 17){ //|| (this.house_hand.get_hard_value() == 17 && this.house_hand.get_soft_value() == 7)){
        this.house_hand.get_card(this.deck);

      }else{
    
        break;
      }

      //end game if house soft hand value above 21
      if (this.house_hand.get_soft_value()  > 21){
        this.dealer_bust();
        break;
      }

    }

  }

  //record all states
  record_result(hand, result){
    for (let i = 0; i < hand.states.length; i++){

      this.data.add_state(hand.states[i], result, hand.bet);
    }
  }

  //end the player turn and transfer unplayed hand to the player hands list
  end_player_turn(){
    this.player_unplayed_hands[0].played = true;
    this.player_hands.push(this.player_unplayed_hands[0])
    this.player_unplayed_hands.splice(0,1);
  }

  //dealer busts and all players wins
  dealer_bust(){
    for (let i = 0; i < this.player_hands.length; i++){
      this.game_over = true;
      this.player_win(this.player_hands[i]);
    }
  }

  //record player win
  player_win(hand){
    this.record_result(hand, "W");
    this.game_over = true;
  }

  //record player win with natural blackjack - bet changes to 1.5
  player_win_natural_blackjack(hand){
    hand.bet = 1.5;
    this.record_result(hand, "W");
    this.game_over = true;
  }

  //record house win
  house_win(hand){
    this.record_result(hand, "L");
    this.game_over = true;   
  }

  //record push
  player_push(hand){
    this.record_result(hand, "P");
    this.game_over = true;
  }

  //end game and check for a shuffle
  end_game(){

    this.deck.check_shuffle();

    this.game_over = false;
  }

  //play game using specific hand values for player and house
  play_game(num_games, player_hand_value, player_has_ace, initial_house_card, initial_strategy){

      for(let i = 0; i< num_games; i++){
        this.deal_specific_cards(player_hand_value, player_has_ace, initial_house_card);

        this.initial_strategy = initial_strategy;
        this.play();

        this.deck.shuffle(); //shuffle or we will use up all the requested cards
      }
      this.data.set_best_strategy(this.data.hard_result_dict, player_hand_value, initial_house_card, ["S", "H"]);

      //record results for each hand in browser with values below
      if (initial_house_card == 2 && player_hand_value == 12){
        add_row_expected_value_table(player_hand_value, initial_house_card, initial_strategy, this.data.get_expected_value(this.data.hard_result_dict, player_hand_value, initial_house_card, initial_strategy));
      }

    
  }
}

class Data{
  constructor(){
    this.hard_result_dict = {}; //key is player_value-house_value-action with an array [ wins, losses, pushes, total games ]; best strategy key is player_value-house_value
    this.soft_result_dict = {};
    this.initial_house_values = [2,3,4,5,6,7,8,9,10,11];
    this.player_hard_values = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
    this.player_soft_values = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
    this.counter = COUNTER;
  }

  //get the strategy that has the highest win percentage
  set_best_strategy(dict, player_hand_value, initial_house_card_value, actions){
    let best_action = actions[0];
    let current_win_strategy;
    let next_win_strategy;
    let best_strategy_expected_value; 

    //convert aces to 11
    if (initial_house_card_value == "A"){
      initial_house_card_value = 11;
    }
    let key = `${initial_house_card_value}-${player_hand_value}`;

    for (let i = 1; i < actions.length; i++){
      current_win_strategy = this.get_expected_value(dict, player_hand_value, initial_house_card_value, best_action);
      best_strategy_expected_value = current_win_strategy;
      next_win_strategy = this.get_expected_value(dict, player_hand_value, initial_house_card_value, actions[i]);
      if (current_win_strategy < next_win_strategy){
        //best expected value given the options
        best_strategy_expected_value = next_win_strategy;

        //next strategy is better
        best_action = actions[i];
      }
    }
    
    //record best action for state
    dict[key] = best_action;

    //if expected value is less than -.5 surrender
    if (best_strategy_expected_value < -.5){
      best_action = "SR";
    }

    //update cell color depending on best action
    $(`#${key}-${this.counter}`).removeClass();
    if (best_action == "H"){
      $(`#${key}-${this.counter}`).addClass("hit");
    }else if (best_action == "S") {
      $(`#${key}-${this.counter}`).addClass("stay");
    } else if (best_action == "SR"){
      $(`#${key}-${this.counter}`).addClass("surrender");
    }
  }

  //get the strategy that has the highest win percentage
  get_best_strategy(dict, player_hand_value, initial_house_card_value){
    let key = `${initial_house_card_value}-${player_hand_value}`;
    if (!(key in dict)){
      return false;
    } else {
      return dict[key];
    }
  }

  //get the best expected value for this state
  get_expected_value(dict, player_hand_value, initial_house_card_value, action){
    let key = `${initial_house_card_value}-${player_hand_value}-${action}`;
    if (!(key in dict)){
      return false;
    } else {
      return ((dict[key][4]/(dict[key][0]+dict[key][1])));
    }
  }

  //add state to dict
  add_state(state, result, bet){
    let i = 1;
    if (result == "W"){
      i = 0;
    }else if (result == "L"){
      i = 1;
    }else {
      i = 2;
    }

    //only record hard key if it is less than 22
    if (state.player_hard_value < 21) {
      this.update_dict(this.hard_result_dict, state.initial_house_card_value, state.player_hard_value, state.action, i, bet);
    }
    
    //only record if different than hard_value
    if (state.player_hard_value != state.player_soft_value){
      //removed until a soft table is added
      //this.update_dict(this.soft_result_dict, state.initial_house_card_value, state.player_soft_value, state.action, i, bet);
    }
  }

  //update the state dictionary
  update_dict(dict, initial_house_card_value, player_hand_value, action, result_index, bet){

    let key = `${initial_house_card_value}-${player_hand_value}-${action}`;
    
    //verify key exists
    if (!(key in dict)){
      dict[key] = [0,0,0,0,0,0]; 
    }

    //update number of games
    dict[key][3] += 1; 

    //update win/loss/push results
    dict[key][result_index] += 1;

    //update winnings - expected value
    if (result_index == 0){ //win
      dict[key][4] += bet;
    } else if (result_index == 1){ //loss
      dict[key][4] -= bet;
    }

    //expected value per hand win/loss hands
    dict[key][5] = (dict[key][4]/(dict[key][0]+dict[key][1])).toFixed(6);

    //display win/loss/push stats
    $(`#${key}-${this.counter}`).text(`${dict[key][5]}`);
  }
}

//test the deck draws for uniform distribution
class Tests{
  constructor(){
  }

  start(){
    const deck = new Deck(1);
    deck.init();

    let card;
    let card_index;
    let card_count = [];
    let results = [];

    for (let i = 0; i < ALL_CARDS.length; i++){
      card_count.push(0);
    
    }

    for (let i = 0; i < 100000; i++){
      card = deck.get_card();
      deck.shuffle();
      card_index = ALL_CARDS.findIndex((element) => element == card);
      card_count[card_index] += 1;
    }

    //log the number of draws of each card compared with the card
    for (let i = 0; i < ALL_CARDS.length; i ++){
      results.push(`${ALL_CARDS[i]}, ${card_count[i]}`); 
    }
    console.log(results); //log card counts
  }
}

//add html table to display expected values
function add_table(column_list){
  let house_values = [2,3,4,5,6,7,8,9,10,11];

  let table_html = `<table id="strat_table_${COUNTER}">
    <tbody>
      <tr><th>Simulation #${COUNTER}</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th></tr>
    </tbody>
  </table>`

  $(`#result_tables`).append(table_html);


  let row = "<tr>";
  
  for (let i = 0; i < column_list.length; i++){
    row += `<td>${column_list[i]}</td>`;
    for (let j = 0; j < house_values.length; j++){
      row += `<td id="${house_values[j]}-${column_list[i]}-${COUNTER}">H:<span id="${house_values[j]}-${column_list[i]}-H-${COUNTER}"></span><br>S:<span id="${house_values[j]}-${column_list[i]}-S-${COUNTER}"></span></td>`
    }
    row += "</tr>";

    $(`#strat_table_${COUNTER} tr:last`).after(row);
    row = "<tr>"
  }

  $(`#result_tables`).append("<br />");
}

//add to expected value table
function add_row_expected_value_table(player_hand_value, house_hand_value, action, expected_value){
  let row = "<tr>";
  row += `<td>${player_hand_value}</td><td>${house_hand_value}</td><td>${action}</td><td>${expected_value}</td>`;
  $('#expected_values tr:last').after(row);
}

//play a number of games starting from an initial player hand value of 20; after playing the num games of player hand value/initial house value pair determine which strategy is best
function simulate_games(num_games){
  const game = new Game();
  let house_values = [2,3,4,5,6,7,8,9,10,"A"];
  let actions = ["S", "H"];

  //clear data after each replication
  game.clear_data();

  //table for displaying results
  add_table([20,19,18,17,16,15,14,13,12,11,10]);

  COUNTER += 1;

  for (let player_hand_value = 20; player_hand_value > 9; player_hand_value--){
    for (let i = 0; i < house_values.length; i++){
      for (let j = 0; j < actions.length; j ++){
        game.play_game(num_games, player_hand_value, false, house_values[i], actions[j]);
      }
      
    }
  } 

}

//run test on RV
const test = new Tests();
test.start();


//run the simulation using the button on the html site
$("#play_button").click(function (){

  let num_games = $('#num_games').val();
  let replications = $('#replications').val();

  for (let r = 0; r < replications; r++){

    setTimeout(() => { simulate_games(num_games); }, 0);
  }
});

